import Commands from '../commands';

var util = require('util');
var ErrorWrapper = require('../errorWrapper').default;
var Tape = require('../tape');
var dQStringMatcher = require('../tokenizer/matchers/dqStringMatcher');
var jsMatcher = require('../tokenizer/matchers/jsMatcher');
var chainMatcher = require('../tokenizer/matchers/chainMatcher');
var redirMatcher = require('../tokenizer/matchers/redirMatcher');
var globMatcher = require('../tokenizer/matchers/globMatcher');

var ast = require('../ast/nodes/descentParserNodes');

export default class DescentParser {
	public tape;
	public firstCommand: boolean;

	constructor (private commands: Commands) {
	}

	ERROR (expected?) {
		return {
			type: 'ERROR',
			err: true,
			pos: this.tape.pos,
			token: this.tape.peek(),
			expected: expected,
		};
	}

	/******************* TODO TODO TODO MUST CONSIDER EOF WHEN CALLING tape.next() ********************/

	REDIRECTION () {
		if (!this.tape.hasMore()) {
			return this.ERROR(globMatcher.tokens.GLOB);
		}

		var first = this.tape.next(); // contains direction and possibly fd

		var allowed = redirMatcher.tokens;
		if (!(first.type.id in allowed)) {
			this.tape.prev();
			return this.ERROR(allowed);
		}

		if (!this.tape.hasMore()) {
			this.tape.prev();
			return this.ERROR(globMatcher.tokens.GLOB);
		}

		var second = this.tape.next(); // target
		if (second.type !== globMatcher.tokens.GLOB) {
			this.tape.prev();
			this.tape.prev();
			return this.ERROR(globMatcher.tokens.GLOB);
		}

		if (first.type === redirMatcher.tokens.GTAMP || first.type === redirMatcher.tokens.LTAMP) {
			if (isNaN(Number(second.text))) {
				return this.ERROR();
			}
		}

		return ast.REDIR(first, second);
	}

	SIMPLE_COMMAND () {

		var redirs = [];
		var cmd;
		var args = [];

		var current;
		do {
			current = this.REDIRECTION();
			current.err || redirs.push(current);
		} while (!current.err);

		cmd = this.tape.next();
		if (cmd.type && cmd.type === 'COMPLETION') {
			// TODO RETURN COMPLETION OBJECT FOR COMMAND NAME
			//console.log('returning completion');
			return {
				type: 'COMPLETION',
				'completion-type': 'COMMAND-NAME',
				prefix: cmd.text,
			};
		} else if (cmd.type !== globMatcher.tokens.GLOB || !this.commands.isCmd(cmd.text)) {
			// TODO REWIND ENOUGH TOKENS (use redirs.length)
			return new ErrorWrapper('Unknown command: \'' + cmd.text + '\'');
		}

		while (this.tape.hasMore()) {
			current = this.tape.next();
			if (current.type === globMatcher.tokens.GLOB) {
				args.push(ast.GLOB(current));
			} else if (current.type === jsMatcher.tokens.JSTOKEN) {
				args.push(ast.JS(current));
			} else if (current.type === dQStringMatcher.tokens.DQSTRING) {
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

		if (this.tape.hasMore() && this.tape.peek().type === 'COMPLETION') {
			// TODO RETURN COMPLETION OBJECT CONTAINING AST NODE BUILT SO FAR
//        console.log('returning completion 2');

			return {
				type: 'COMPLETION',
				'completion-type': 'COMMAND-ARGUMENT',
				node: node,
				prefix: this.tape.next().text,
			};
		}
		//console.log('returning node without completion');
		return node;
	}

	PIPELINE () {

		var simple = this.SIMPLE_COMMAND();

		if (simple.err || !this.tape.hasMore()) {
			return simple;
		}

		var next = this.tape.next();
		if (next.type === chainMatcher.tokens.PIPE) {
			next = this.PIPELINE();
			if (next.err) {
				// no need to rewind more, recursed call should have rewinded
				this.tape.prev();
				return next; // TODO return something else which wraps `next`
			} else {
				return ast.PIPELINE(simple, next);
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
		if (next.type === chainMatcher.tokens.DPIPE || next.type === chainMatcher.tokens.DAMP) {
			var listType = next.type;
			next = this.LIST();
			if (next.err) {
				// no need to rewind more, recursed call should have rewinded
				this.tape.prev();
			} else {
				if (listType === chainMatcher.tokens.DPIPE) {
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
		if (next.type === chainMatcher.tokens.AMP) {
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
	COMMAND_LINE () {
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
