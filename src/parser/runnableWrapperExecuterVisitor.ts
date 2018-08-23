import * as vm from 'vm';
import * as fs from 'fs';
import {Context} from 'vm';

import * as utils from '../utils';
import Visitor from '../ast/visitors/visitor';
import Commands from '../commands';
import ErrorWrapper from '../errorWrapper';
import {Stream} from 'stream';
import {DescentParserNode} from '../ast/nodes/descentParserNodes';

import AndRunnable from './runners/andRunnable';
import OrRunnable from './runners/orRunnable';
import PipeRunnable from './runners/pipeRunnable';
import SequenceRunnable from './runners/sequenceRunnable';

var superVisit = Visitor.prototype.visit;

import * as globMatcher from '../tokenizer/matchers/globMatcher';
import {Token} from '../tokenizer/commandLineTokenizer';
import ValueRunnable from './runners/valueRunnable'

export type runnableCallback = (result: any) => void;
export type fdConfig = (Stream | number | 'pipe');
export interface Runnable {
	pipes?: fdConfig[];

	hasConfig: (fd: number) => boolean;
	configFd: (fd: number, stream: fdConfig) => void;
	run: (callback: runnableCallback) => void;
}

interface TokenGroup {
	globbing: boolean;
	group: Token[];
}

export default class ExecuterVisitor extends Visitor {

	constructor (private commandSet: Commands, private context: Context) {
		super();
	}

	visitREDIR (redir: DescentParserNode): Runnable {
		// HANDLED DIRECTLY IN COMMAND
		return null;
	}

	toString (): string {
		return 'RunnableWrapperExecuterVisitor';
	}

	visitCOMMAND (node: DescentParserNode): Runnable {
//    return an object that
//        has a set of [fd->stream] mappings which will be applied when running
//        has a run method which will start whatever, with said redirections
//        has a method to map fd->stream (existing fd's cannot be remapped after starting)
//        has the same, or a different method, to clear redirections (can call with null)
//        has a method to provide access to all open streams, after it started
//        UPDATE the mapping must differentiate between input redirection and output redirection
//        has a method to know, before running, if an fd is supposed to be redirected/inputted

		var args: Runnable[] = [];
		var me = this;
		node.args.forEach((node: DescentParserNode) => {
			const runner: Runnable = me.visit(node);
			// if (node.type === 'GLOB' || node.type === 'DQSTRING') {
				args.push(runner); // Push the runner, push, push the runner
			// } else if (node.type === 'JS') {
			// 	runner.run((res) => {
			// 		args.push(res);
			// 	});
			// }
		});
		const runner: Runnable = this.commandSet.getCmdRunnable(node.cmd, args);
		node.redirs.forEach(function (redir) {
			var direction = redir.direction.type.toString();
			var fd = redir.direction.number;
			var target = redir.target;

			if (direction === 'LT') {
				if (!utils.isNumber(fd)) {
					fd = 0;
				}
				runner.configFd(fd, fs.createReadStream(target.text));
			} else if (direction === 'GT') {
				if (!utils.isNumber(fd)) {
					fd = 1;
				}
				runner.configFd(fd, fs.createWriteStream(target.text)); // truncates
			} else if (direction === 'GTGT') {
				if (!utils.isNumber(fd)) {
					fd = 1;
				}
				runner.configFd(fd, fs.createWriteStream(target.text, {flags: 'a'}));
			} else if (direction === 'LTGT') {
				if (!utils.isNumber(fd)) {
					fd = 0;
				}
				runner.configFd(fd, fs.createWriteStream(target.text, {flags: 'a'}));
			} else if (direction === 'GTAMP') {
				// TODO THIS DOESN'T REALLY WORK RIGHT NOW, FD VALUE IS PASSED DIRECTLY TO SPAWN SO IT REFERS TO PARENT'S FD. SAME GOES FOR LTAMP
				if (!utils.isNumber(fd)) {
					fd = 1;
				}
				runner.configFd(fd, Number(target.text));
			} else if (direction === 'LTAMP') {
				if (!utils.isNumber(fd)) {
					fd = 0;
				}
				runner.configFd(fd, Number(target.text));
			}

			// TODO MUST DETECT DUPLICATE FDs AND OPEN DUPLEX STREAM FOR THEM (e.g., "somecommand 7>thefile 7<thefile")

		});
		return runner;
	}

	visitPIPELINE (pipeline: DescentParserNode): Runnable {
		const left: Runnable = this.visit(pipeline.left);
		const right: Runnable = this.visit(pipeline.right);
//
//    left.clearRedirect(1);
//    right.clearInput(0);
//
//    // methods that get/set mappings must check for 1 and 0, and apply it to the corresponding child. other fd's should
//    // either be ignored or applied to both children. if the latter, then keep a record of them
//
//    function run (callback) {
//        left.run(noop);
//        right.run(callback);
//        left.pipes[1].pipe(right.pipes[0]);
//
//        this.pipes = [left.pipes[0], right.pipes[1]]; // may also apply other redirections if more than 1 and 0 are allowed
//    }

		return new PipeRunnable(left, right);
	}

	visitAND_LIST (list: DescentParserNode): Runnable {
		const left = this.visit(list.left);
		const right = this.visit(list.right);

		return new AndRunnable(left, right);
	}

	visitOR_LIST (list: DescentParserNode): Runnable {
		const left = this.visit(list.left);
		const right = this.visit(list.right);

		return new OrRunnable(left, right);
	}

	visitSEQUENCE (sequence: DescentParserNode): Runnable {
		const left = this.visit(sequence.left);
		var right;
		if (sequence.right) {
			right = this.visit(sequence.right);
		}

		return new SequenceRunnable(left, right);
	}

	visitGLOB (glob: DescentParserNode): Runnable {
		var subTokens: Token[] = glob.glob.subTokens;

		/* If the first token is ~ then expand it to home dir if it is alone or if it is followed by a path separator */
		if (subTokens[0].text === '~' && (subTokens.length === 1 || subTokens[1].type === globMatcher.SUBTOKENS.SEPARATOR)) {
			subTokens[0].text = utils.getUserHome();
		}

		/* First phase: transform the subtoken list into another one with literal path components and globbed path components */
		var tokenGroups: TokenGroup[] = [];
		var tokenGroup: TokenGroup = {
			globbing: false,
			group: [],
		};
		subTokens.forEach((subToken: Token, i: number) => {
			tokenGroup.group.push(subToken);
			/* If this is a separator or the last subtoken, close the current group */
			if (subToken.type === globMatcher.SUBTOKENS.SEPARATOR || i === subTokens.length - 1) {
				var lastGroup: TokenGroup = tokenGroups[tokenGroups.length - 1];
				if (
					lastGroup &&
					!tokenGroup.globbing &&
					!lastGroup.globbing
				) {
					lastGroup.group = lastGroup.group.concat(tokenGroup.group);
				} else {
					tokenGroups.push(tokenGroup);
				}
				tokenGroup = {
					globbing: false,
					group: [],
				};
			} else if (subToken.type === globMatcher.SUBTOKENS.STAR || subToken.type === globMatcher.SUBTOKENS.QUESTION) {
				tokenGroup.globbing = true;
			}
		});

		/* Second phase: build the list of matched paths evaluating one component at a time. For literals, append it to each one */
		var extracted: string[] = [''];
		var aux: string[];
		var join: string;
		var regex: RegExp;
		var dirs: string[];
		tokenGroups.forEach(function (tokenGroup, i) {
			if (tokenGroup.globbing) {
				regex = buildRegex(tokenGroup.group);
				aux = [];
				extracted.forEach((extr: string) => {
					dirs = fs.readdirSync(extr || '.');
					dirs.forEach((dir: string) => {
						if (regex.test(dir)) {
							aux.push(extr + dir);
						}
					});
				});
				extracted = aux;
			} else {
				join = tokenGroup.group.reduce(function (prev, token) {
					return prev + token.text;
				}, '');
				extracted = extracted.map(function (extr) {
					return extr + join;
				});
			}
		});

		function buildRegex (tokenGroup: Token[]): RegExp {
			var re: string = '^';
			tokenGroup.forEach(function (token) {
				if (token.type === globMatcher.SUBTOKENS.STAR) {
					re += '.*';
				} else if (token.type === globMatcher.SUBTOKENS.QUESTION) {
					re += '.';
				} else {
					re += token.text.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
				}
			});
			re += '$';
			return new RegExp(re);
		}

		return new ValueRunnable(extracted);
	}

	visitJS (token: DescentParserNode): Runnable {
		const context: Context = this.context;
		return {
			run: function (callback) {
				try {
					var result = vm.runInContext(token.token.text, context);
					callback(result);
				} catch (e) {
					callback(new ErrorWrapper(e));
				}
			},
			hasConfig: function (fd) {
				return false;
			},
			configFd: function (fd, config) {
			},
		}
	}

	visitDQSTRING (dqstring: DescentParserNode): Runnable {
		const value = vm.runInNewContext(dqstring.token.text);
		return new ValueRunnable(value);
	}

// OVERRIDE VISIT()
// MAKE IT TELL BETWEEN JS AND CMD
// MAKE IT TAKE A CALLBACK
// FOR JS, RUN IT AND CALLBACK WITH RESULT
// FOR CMD, VISIT FIRST NODE AND GET CHILD_PROCESS BACK
// APPLY INHERIT STDIO -> HOW TO KNOW IF THERE WAS A REDIRECTION OR NOT???
// APPEND CALLBACK TO CHILD_PROCESS

// HOW TO RUN VISIT() ONLY ONCE??? -> SOME PRE-VISIT SUPER METHOD?


	visitERROR (err: DescentParserNode): DescentParserNode {
		return err;
	}

	visit (node: DescentParserNode): Runnable {
		var thisVisit = this.visit;
		this.visit = superVisit; // temporarily. tricky. never saw this anywhere. wonder if it really works
		var runner = this.visit(node);
		this.visit = thisVisit;
		if (!runner.hasConfig(0)) {
			runner.configFd(0, process.stdin);
		}
		if (!runner.hasConfig(1)) {
			runner.configFd(1, process.stdout);
		}
		if (!runner.hasConfig(2)) {
			runner.configFd(2, process.stderr);
		}
		return runner;
	}
}
