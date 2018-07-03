import * as util from 'util';

import Commands from '../commands';
import {Token} from '../tokenizer/commandLineTokenizer';
import Tape from '../tape';
import ErrorWrapper from '../errorWrapper';

import * as dQStringMatcher from '../tokenizer/matchers/dqStringMatcher';
import * as jsMatcher from '../tokenizer/matchers/jsMatcher';
import * as chainMatcher from '../tokenizer/matchers/chainMatcher';
import * as redirMatcher from '../tokenizer/matchers/redirMatcher';
import * as globMatcher from '../tokenizer/matchers/globMatcher';
import * as completionParser from './completionParser';
import {DescentParserNode} from '../ast/nodes/descentParserNodes';

import * as ast from '../ast/nodes/descentParserNodes';

export default class DescentParser {
	public firstCommand: boolean = true;

	constructor (
		private commands: Commands,
		private tape: Tape<Token>
	) {
	}

	ERROR (expected?: any/*TODO ANY*/): DescentParserNode {
		return {
			type: 'ERROR',
			err: true,
			pos: this.tape.pos,
			token: this.tape.peek(),
			expected: expected,
		};
	}

	/******************* TODO TODO TODO MUST CONSIDER EOF WHEN CALLING tape.next() ********************/

	REDIRECTION (): DescentParserNode {
		if (!this.tape.hasMore()) {
			return this.ERROR(globMatcher.TOKENS.GLOB);
		}

		const first: Token = this.tape.next(); // contains direction and possibly fd

		const allowed = redirMatcher.TOKENS;
		if (!(<any>Object).values(allowed).includes(first.type)) {
			this.tape.prev();
			return this.ERROR(allowed);
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

	SIMPLE_COMMAND (): DescentParserNode | ErrorWrapper {
		var redirs: DescentParserNode[] = [];
		var cmd: Token;
		var args: DescentParserNode[] = [];

		var current;
		do {
			current = this.REDIRECTION();
			current.err || redirs.push(current);
		} while (!current.err);

		cmd = this.tape.next();
		if (cmd.type === completionParser.COMPLETION_TYPE) { ////TODO TODO TODO
			// TODO RETURN COMPLETION OBJECT FOR COMMAND NAME
			//console.log('returning completion');
			return {
				type: completionParser.COMPLETION,
				'completion-type': 'COMMAND-NAME',
				prefix: cmd.text,
			};
		} else if (cmd.type !== globMatcher.TOKENS.GLOB || !this.commands.isCmd(cmd.text)) {
			// TODO REWIND ENOUGH TOKENS (use redirs.length)
			return new ErrorWrapper('Unknown command: \'' + cmd.text + '\'');
		}

		while (this.tape.hasMore()) {
			current = this.tape.next();
			if (current.type === globMatcher.TOKENS.GLOB) {
				args.push(ast.GLOB(current));
			} else if (current.type === jsMatcher.TOKENS.JSTOKEN) {
				args.push(ast.JS(current));
			} else if (current.type === dQStringMatcher.TOKENS.DQSTRING) {
				args.push(ast.DQSTRING(current));
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
		var node = ast.COMMAND(cmd.text, args, redirs);

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

	PIPELINE () {

		var simple = this.SIMPLE_COMMAND();

		if (simple.err || !this.tape.hasMore()) {
			return simple;
		}

		var next = this.tape.next();
		var node;
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

	LIST () {
		var pipeline = this.PIPELINE();
		if (pipeline.err || !this.tape.hasMore()) {
			return pipeline;
		}

		var next = this.tape.next();
		if (next.type === chainMatcher.TOKENS.DPIPE || next.type === chainMatcher.TOKENS.DAMP) {
			var listType = next.type;
			next = this.LIST();
			if (next.err) {
				// no need to rewind more, recursed call should have rewinded
				this.tape.prev();
			} else {
				if (listType === chainMatcher.TOKENS.DPIPE) {
					return ast.OR_LIST(pipeline, next);
				} else {
					return ast.AND_LIST(pipeline, next);
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
	SUBSHELL () {
		var list = this.LIST();
		if (list.err || !this.tape.hasMore()) {
			return list;
		}
		var next = this.tape.next();
		if (next.type === chainMatcher.TOKENS.AMP) {
			next = this.SUBSHELL();
			if (next.err) {
				return ast.SEQUENCE(list);
			} else {
				return ast.SEQUENCE(list, next);
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
		var subs = this.SUBSHELL();
		if (subs.err) {
			return subs;
		}
		if (this.tape.hasMore()) {
			return this.ERROR('EOF');
		}
		return subs;
	}
}
