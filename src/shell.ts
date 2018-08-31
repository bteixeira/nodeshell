import * as vm from 'vm';
import * as util from 'util';
import * as path from 'path';
import * as readline from 'readline';
import {ReadStream, WriteStream} from 'tty';
import 'colors';

import KeyHandler from './keyhandler';
import LineReader from './lineReader';
import ExecuterVisitor, {executionCallback} from './ast/visitors/executerVisitor';
import LayoutComposer, {LayoutSpec} from './panels/composer';
import History from './history';
import WriterPanel from './panels/tree/writerPanel';
import Panel from './panels/tree/panel';
import CommandSet from './commandSet';

import defaultCommands from './config/defaultCommands';
import defaultCommandCompletions from './config/defaultCommandCompletions';
import defaultKeyBindings from './config/defaultKeyBindings';
import * as utils from './utils';
import * as defaultLineParser from './parser/defaultLineParser';
import * as CompletionParser from './parser/completionParser';
import {DescentParserNode} from './ast/nodes/descentParserNodes';
import {Stream} from 'stream';



const stdin: ReadStream = process.stdin as ReadStream;
const stdout: WriteStream = process.stdout as WriteStream; // TODO SHOULD BE Stream.Writable, WriterPanel MUST STOP DEPENDING ON .columns TO CHANGE THIS
const stderr: WriteStream = process.stderr as WriteStream;
const stdio: Stream[] = [stdin, stdout, stderr];
var paused: boolean = false;
var rootPanel: Panel;
const lineReader: LineReader = new LineReader(new WriterPanel(stdout));
const keyHandler: KeyHandler = new KeyHandler(stdin);
const permanent: {[prop: string]: any} = {
	process: process,
	Buffer: Buffer,
	setTimeout: setTimeout,
	setInterval: setInterval,
	clearTimeout: clearTimeout,
	clearInterval: clearInterval,
	setImmediate: setImmediate,
	clearImmediate: clearImmediate,
	console: console,
	require: require,
	nsh: {
		lineReader: lineReader,
		bindings: keyHandler,
		utils: utils,
		completion: CompletionParser,
		alias: function (handle: string, body: string) {
			const rootNode: DescentParserNode = defaultLineParser.parseCmdLine(body, commands);
			if (rootNode.err) {
				throw rootNode.err;
			}
			if (rootNode.type !== 'COMMAND') {
				throw 'Alias body must be a valid command name';
				// TODO ALIAS BODY COULD BE ANYTHING
			}
			commands.addCmd(handle, (args: string[], streams: Stream[], callback: executionCallback) => {
				// TODO BRING BACK ALIASES

				// TODO 1 HAVE THE VISITOR VISIT EACH ARGUMENT CHILD NODE, STORE THE VALUES
				// TODO 2 WHEN BARRIER IS REACHED...
					// TODO 3 INVOKE commands.addCmd(argValues.concat(args), streams, callback)

				var n: number = rootNode.args.length;
				var argValues: any[] = [];

				if (n === 0) {
					runCommand();
				} else {
					rootNode.args.forEach((arg, i) => {
						executerVisitor.visit(arg, stdio, (value) => {
							n -= 1;
							argValues[i] = value;
							if (n === 0) {
								runCommand();
							}
						});
					});
				}

				function runCommand () {
					commands.runCmd(rootNode.cmd, argValues.concat(args), streams, callback);
				}
			}, '[alias]');
		},
		home: __dirname,
		setLayout: setLayout,
		on: function (event: string, cb: () => any) {
			// TODO
		},
		layout: null,
	},
};
const extend = utils.extend;
const ctx = vm.createContext(permanent);
const commands = new CommandSet(defaultCommands());
const executerVisitor = new ExecuterVisitor(commands, ctx);
const history = new History(lineReader);



process.on('SIGINT', () => {
	console.log('\nSIGINT'.blue.bold);
	if (!paused) {
		console.log();
		lineReader.refreshLine();
	}
});
process.on('SIGCHLD', function () {
	if (paused) {
		console.log('\nSIGCHLD -- job management is not supported, please manage child process with signals'.blue.bold);
		lineReader.refreshLine();
		process.stdin.resume();
		process.stdin.setRawMode(true);
		paused = false;
	}
});
process.on('SIGTSTP', function () {
});

function setLayout (spec: LayoutSpec) {
	// TODO validate spec according to high-level strict rules
	rootPanel = LayoutComposer.buildInit(spec, stdout);
	lineReader.setWriter(rootPanel.prompt);
	permanent.nsh.layout = rootPanel;
}

function inspect (what: any) {
	if (what instanceof Error) {
		return what.toString().red;
	} else {
		return util.inspect.call(this, what, {colors: true});
	}
}

function doneCB (result: any) {
	console.log(inspect(result));
	// TODO MAKE READ-ONLY PROPERTIES INSTEAD
	extend(ctx, permanent);
	rootPanel.reset();
	rootPanel.reserveSpace();
	rootPanel.rewrite();
	lineReader.refreshLine();
	process.stdin.resume();
	process.stdin.setRawMode(true);
	paused = false;
}

lineReader
	.setPrompt(function () {
		// Sets the default prompt TODO MOVE THIS INSIDE THE LINEREADER
		return process.cwd() + ' \u2B21  '.green; // or \u2B22
	})
	.updatePrompt()
	.on('accept', function (line: string) {
		rootPanel.writers.forEach(function (writer) {
			if (writer !== rootPanel.prompt) {
				writer.cursorTo(1, 1);
				writer.clearScreenDown();
			}
		});

		process.stdin.setRawMode(false);
		process.stdin.pause();
		readline.clearScreenDown(process.stdout);
		paused = true;
		var err: DescentParserNode;
		var rootNode: DescentParserNode = defaultLineParser.parseCmdLine(line, commands);
		if (rootNode.err && rootNode.firstCommand) {
			/* Immediately failed parsing for CMD, try JS */
			err = rootNode;
			rootNode = defaultLineParser.parseJS(line);
			executerVisitor.visit(rootNode, stdio, result => {
				if (result instanceof Error) {
					// Magic! If line is ambiguous and could have been both a command and JS, but both errored, show both errors
					if (err.message) {
						console.log(err.message.red);
					} else {
						console.log(inspect(err));
					}
				}
				doneCB(result);
			});
		} else if (rootNode.err) {
			/* Failed CMD parsing later on, can not recover */
			doneCB(rootNode);
		} else {
			/* Succeeded in CMD parsing, execute */
			executerVisitor.visit(rootNode, stdio, doneCB);
		}
	});
defaultCommandCompletions(CompletionParser);
defaultKeyBindings(keyHandler, lineReader, history, () => {
	CompletionParser.parseCmdLine(lineReader, commands, rootPanel.completions);
});
setLayout({name: 'prompt'});

function runUserFile () {
	var NSH_FILE = '.nsh.js';
	var home = utils.getUserHome();
	utils.sourceSync(path.join(home, NSH_FILE), ctx);
	utils.sourceSync(path.join('.', NSH_FILE), ctx);
}

runUserFile();

rootPanel.writers.forEach(function (writer) {
	if (writer !== rootPanel.prompt) {
		writer.rewrite();
	}
});

lineReader.refreshLine();
