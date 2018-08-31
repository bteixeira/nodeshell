import * as vm from 'vm';
import {Context} from 'vm';
import * as fs from 'fs';
import {PassThrough, Stream} from 'stream';

import * as utils from '../../utils';
import * as globMatcher from '../../tokenizer/matchers/globMatcher';
import Visitor from './visitor';
import CommandSet from '../../commandSet';
import {DescentParserNode} from '../nodes/descentParserNodes';
import {Token} from '../../tokenizer/commandLineTokenizer';

interface TokenGroup {
	globbing: boolean;
	group: Token[];
}

export type executionCallback = (value: any) => void;

export default class ExecuterVisitor extends Visitor {

	constructor(private commandSet: CommandSet, private context: Context) {
		super();
	}

	visitREDIR(node: DescentParserNode, streams: Stream[], callback: executionCallback): void {
		// HANDLED DIRECTLY IN COMMAND
		return null;
	}

	visitCOMMAND(node: DescentParserNode, streams: Stream[], callback: executionCallback): void {
		const cmdStreams = streams.slice();
		const commandSet = this.commandSet;
		node.redirs.forEach(function (redir) {
			const direction = redir.direction.type.toString();
			const target = redir.target;
			var fd = redir.direction.number;

			if (direction === 'LT') {
				if (!utils.isNumber(fd)) {
					fd = 0;
				}
				cmdStreams[fd] = fs.createReadStream(target.text);
			} else if (direction === 'GT') {
				if (!utils.isNumber(fd)) {
					fd = 1;
				}
				cmdStreams[fd] = fs.createWriteStream(target.text); // truncates
			} else if (direction === 'GTGT') {
				if (!utils.isNumber(fd)) {
					fd = 1;
				}
				cmdStreams[fd] = fs.createWriteStream(target.text, {flags: 'a'});
			} else if (direction === 'LTGT') {
				if (!utils.isNumber(fd)) {
					fd = 0;
				}
				cmdStreams[fd] = fs.createWriteStream(target.text, {flags: 'a'});
			} else if (direction === 'GTAMP') {
				// TODO THIS DOESN'T REALLY WORK RIGHT NOW, FD VALUE IS PASSED DIRECTLY TO SPAWN SO IT REFERS TO PARENT'S FD. SAME GOES FOR LTAMP
				if (!utils.isNumber(fd)) {
					fd = 1;
				}
				cmdStreams[fd] = cmdStreams[Number(target.text)];
			} else if (direction === 'LTAMP') {
				if (!utils.isNumber(fd)) {
					fd = 0;
				}
				cmdStreams[fd] = cmdStreams[Number(target.text)];
			}
			// TODO MUST DETECT DUPLICATE FDs AND OPEN DUPLEX STREAM FOR THEM (e.g., "somecommand 7>thefile 7<thefile")
		});

		const argValues: string[] = [];
		var n = node.args.length;
		if (n > 0) {
			node.args.forEach((node: DescentParserNode, i: number) => {
				this.visit(
					node,
					[] /* TODO WE COULD ALSO PASS STREAMS, CONSIDER WHEN AN ARGUMENT MIGHT NEED THEM */,
					(value) => {
						argValues[i] = value;
						n -= 1;
						if (n === 0) {
							runCommand();
						}
					});
			});
		} else {
			runCommand();
		}

		function runCommand () {
			const expandedValues = argValues.reduce((values, item) => {
				return values.concat(item) // This expands any array elements
			}, []).map(item => String(item));
			commandSet.runCmd(node.cmd, expandedValues, cmdStreams, callback);
		}
	}

	visitPIPELINE(pipeline: DescentParserNode, streams: Stream[], callback: executionCallback): void {
		const through = new PassThrough();
		const streamsLeft = [streams[0], through, streams[2]];
		const streamsRight = [through, streams[1], streams[2]];
		this.visit(pipeline.left, streamsLeft, function noop(value) {}); // TODO SHOULD LEFT GO TO JOBS MANAGEMENT? SEEMS CONTRARY TO BASH
		this.visit(pipeline.right, streamsRight, callback);
	}

	visitAND_LIST(list: DescentParserNode, streams: Stream[], callback: executionCallback): void {
		this.visit(list.left, streams, (status: any) => {
			if (status === 0) {
				this.visit(list.right, streams, callback);
			} else {
				callback(status);
			}
		});
	}

	visitOR_LIST(list: DescentParserNode, streams: Stream[], callback: executionCallback): void {
		this.visit(list.left, streams, (status: any) => {
			if (status === 0) {
				callback(status);
			} else {
				this.visit(list.right, streams, callback);
			}
		});
	}

	visitSEQUENCE(sequence: DescentParserNode, streams: Stream[], callback: executionCallback): void {
		// TODO SHOULD ASSIGN STDOUT BUT NOT STDIN ACCORDING TO BASH http://www.lostsaloon.com/technology/how-to-chain-commands-in-linux-command-line-with-examples/
		this.visit(sequence.left, streams, function noop() {}); // TODO NEEDS JOB MANAGEMENT
		if (sequence.right) {
			this.visit(sequence.right, streams, callback);
		}
	}

	visitGLOB(glob: DescentParserNode, streams: Stream[], callback: executionCallback): void {
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

		function buildRegex(tokenGroup: Token[]): RegExp {
			var re: string = '^';
			tokenGroup.forEach(function (token) {
				if (token.type === globMatcher.SUBTOKENS.STAR) {
					re += '.*';
				} else if (token.type === globMatcher.SUBTOKENS.QUESTION) {
					re += '.';
				} else {
					re += token.text.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
				}
			});
			re += '$';
			return new RegExp(re);
		}

		callback(extracted);
	}

	visitJS(token: DescentParserNode, streams: Stream[], callback: executionCallback): void {
		try {
			var result = vm.runInContext(token.token.text, this.context);
			callback(result);
		} catch (e) {
			callback(new Error(e)); /* Exceptions thrown from VM must be wrapped to enable `instanceof` */
		}
	}

	visitDQSTRING(dqstring: DescentParserNode, streams: Stream[], callback: executionCallback): void {
		const value = vm.runInNewContext(dqstring.token.text);
		callback(value);
	}

// OVERRIDE VISIT()
// MAKE IT TELL BETWEEN JS AND CMD
// MAKE IT TAKE A CALLBACK
// FOR JS, RUN IT AND CALLBACK WITH RESULT
// FOR CMD, VISIT FIRST NODE AND GET CHILD_PROCESS BACK
// APPLY INHERIT STDIO -> HOW TO KNOW IF THERE WAS A REDIRECTION OR NOT???
// APPEND CALLBACK TO CHILD_PROCESS

// HOW TO RUN VISIT() ONLY ONCE??? -> SOME PRE-VISIT SUPER METHOD?


	visitERROR(err: DescentParserNode, streams: Stream[], callback: executionCallback): void {
		callback(err);
	}

	visit(node: DescentParserNode, streams: Stream[], callback: executionCallback): void {
		this.dispatch(node, streams, callback);
	}
}
