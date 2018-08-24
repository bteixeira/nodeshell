import Commands from '../commandSet';
import {Token} from '../tokenizer/commandLineTokenizer';
import Tape from '../tape';

import * as dQStringMatcher from '../tokenizer/matchers/dqStringMatcher';
import * as jsMatcher from '../tokenizer/matchers/jsMatcher';
import * as chainMatcher from '../tokenizer/matchers/chainMatcher';
import * as redirMatcher from '../tokenizer/matchers/redirMatcher';
import * as globMatcher from '../tokenizer/matchers/globMatcher';
import * as completionParser from './completionParser';
import * as ast from '../ast/nodes/descentParserNodes';
import {DescentParserNode} from '../ast/nodes/descentParserNodes';

export default class DescentParser {
	public firstCommand: boolean = true;

	constructor (
		private commands: Commands,
		private tape: Tape<Token>
	) {
	}

	ERROR (expected?: (Symbol | Symbol[]), message?: string): DescentParserNode {
		if (!(expected instanceof Array)) {
			expected = [expected];
		}
		return {
			type: 'ERROR',
			err: true,
			pos: this.tape.pos,
			token: this.tape.peek(),
			expected: expected,
			message: message,
		};
	}

	/******************* TODO TODO TODO MUST CONSIDER EOF WHEN CALLING tape.next() ********************/

	REDIRECTION (): DescentParserNode {
		if (!this.tape.hasMore()) {
			return this.ERROR(globMatcher.TOKENS.GLOB);
		}

		const first: Token = this.tape.next(); // contains direction and possibly fd

		const allowedTypes = (<any>Object).values(redirMatcher.TOKENS);
		if (!allowedTypes.includes(first.type)) {
			this.tape.prev();
			return this.ERROR(allowedTypes);
		}
		if (!this.tape.hasMore()) {
			this.tape.prev();
			return this.ERROR(globMatcher.TOKENS.GLOB);
		}

		const second: Token = this.tape.next(); // target
		if (second.type !== globMatcher.TOKENS.GLOB) {
			this.tape.prev();
			this.tape.prev();
			return this.ERROR(globMatcher.TOKENS.GLOB);
		}
		if (first.type === redirMatcher.TOKENS.GTAMP || first.type === redirMatcher.TOKENS.LTAMP) {
			if (isNaN(Number(second.text))) {
				return this.ERROR();
			}
		}

		return ast.REDIR(first, second);
	}

	SIMPLE_COMMAND (): DescentParserNode {
		var redirs: DescentParserNode[] = [];
		var args: DescentParserNode[] = [];

		var current: DescentParserNode;
		do {
			current = this.REDIRECTION();
			if (!current.err) {
				redirs.push(current);
			}
		} while (!current.err);

		var cmd: Token = this.tape.next();
		if (cmd === Tape.EOF) {
			return this.ERROR(globMatcher.TOKENS.GLOB);
		}
		if (cmd.type === completionParser.COMPLETION_TYPE) { ////TODO TODO TODO
			// TODO RETURN COMPLETION OBJECT FOR COMMAND NAME
			return {
				type: completionParser.COMPLETION,
				'completion-type': 'COMMAND-NAME',
				prefix: cmd.text,
			};
		} else if (cmd.type !== globMatcher.TOKENS.GLOB || !this.commands.isCmd(cmd.text)) {
			// TODO REWIND ENOUGH TOKENS (use redirs.length)
			return this.ERROR(null, `Unknown command: "${cmd.text}"`);
		}

		var currentToken: Token;
		while (this.tape.hasMore()) {
			currentToken = this.tape.next();
			if (currentToken.type === globMatcher.TOKENS.GLOB) {
				args.push(ast.GLOB(currentToken));
			} else if (currentToken.type === jsMatcher.TOKENS.JSTOKEN) {
				args.push(ast.JS(currentToken));
			} else if (currentToken.type === dQStringMatcher.TOKENS.DQSTRING) {
				args.push(ast.DQSTRING(currentToken));
			} else {
				this.tape.prev();
				current = this.REDIRECTION();
				if (current.err) {
					break;
				} else {
					redirs.push(current);
				}
			}
		}

		this.firstCommand = false;
		var node: DescentParserNode = ast.COMMAND(cmd.text, args, redirs);

		if (this.tape.hasMore() && this.tape.peek().type === completionParser.COMPLETION_TYPE) { // TODO TODO TODO
			// TODO RETURN COMPLETION OBJECT CONTAINING AST NODE BUILT SO FAR
			return {
				type: completionParser.COMPLETION,
				'completion-type': 'COMMAND-ARGUMENT',
				node: node,
				prefix: this.tape.next().text,
			};
		}
		return node;
	}

	PIPELINE (): DescentParserNode {
		var simple: DescentParserNode = this.SIMPLE_COMMAND();

		if (simple.err || !this.tape.hasMore()) {
			return simple;
		}

		var next: Token = this.tape.next();
		var node: DescentParserNode;
		if (next.type === chainMatcher.TOKENS.PIPE) {
			node = this.PIPELINE();
			if (node.err) {
				// no need to rewind more, recursed call should have rewinded
				this.tape.prev();
				return node; // TODO return something else which wraps `next`
			} else {
				return ast.PIPELINE(simple, node);
			}
		} else {
			this.tape.prev();
		}
		return simple;
	}

	LIST (): DescentParserNode {
		var pipeline: DescentParserNode = this.PIPELINE();
		if (pipeline.err || !this.tape.hasMore()) {
			return pipeline;
		}

		var nextToken: Token = this.tape.next();
		var nextNode: DescentParserNode;
		if (nextToken.type === chainMatcher.TOKENS.DPIPE || nextToken.type === chainMatcher.TOKENS.DAMP) {
			var listType: symbol = nextToken.type;
			nextNode = this.LIST();
			if (nextNode.err) {
				// no need to rewind more, recursed call should have rewinded
				this.tape.prev();
			} else {
				if (listType === chainMatcher.TOKENS.DPIPE) {
					return ast.OR_LIST(pipeline, nextNode);
				} else {
					return ast.AND_LIST(pipeline, nextNode);
				}
			}
		} else {
			this.tape.prev();
		}
		return pipeline;
	}

	/**
	 * LIST
	 *
	 * LIST AMP
	 *
	 * LIST AMP SUBSHELL
	 */
	SUBSHELL (): DescentParserNode {
		var list: DescentParserNode = this.LIST();
		if (list.err || !this.tape.hasMore()) {
			return list;
		}
		var nextToken: Token = this.tape.next();
		var nextNode: DescentParserNode;
		if (nextToken.type === chainMatcher.TOKENS.AMP) {
			nextNode = this.SUBSHELL();
			if (nextNode.err) {
				return ast.SEQUENCE(list);
			} else {
				return ast.SEQUENCE(list, nextNode);
			}
		} else {
			this.tape.prev();
			return list;
		}
	}

	/**
	 * SUBSHELL EOF
	 */
	COMMAND_LINE (): DescentParserNode {
		var subs: DescentParserNode = this.SUBSHELL();
		if (subs.err) {
			return subs;
		}
		if (this.tape.hasMore()) {
			return this.ERROR(Symbol('EOF'));
		}
		return subs;
	}
}
