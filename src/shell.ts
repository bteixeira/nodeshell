import * as vm from 'vm';
import * as util from 'util';
import * as path from 'path';
import * as readline from 'readline';
import {ReadStream, WriteStream} from 'tty';
import 'colors';

import KeyHandler from './keyhandler';
import LineReader from './lineReader';
import RWEVisitor from './parser/runnableWrapperExecuterVisitor';
import {Runnable} from './parser/runnables/runnable'
import LayoutComposer, {LayoutSpec} from './panels/composer';
import ErrorWrapper from './errorWrapper';
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



const stdin: ReadStream = process.stdin as ReadStream;
const stdout: WriteStream = process.stdout as WriteStream;
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
			var ast = defaultLineParser.parseCmdLine(body, commands);
			if (ast.err) {
				throw ast.err;
			}
			if (ast.type !== 'COMMAND') {
				throw 'Alias body must be a valid command name';
			}
			commands.addCmd(handle, function (args) {
				// TODO BRING BACK ALIASES
				return null;
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
const executerVisitor = new RWEVisitor(commands, ctx);
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
	if (what instanceof ErrorWrapper) {
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
		var runnable: Runnable;
		var err: DescentParserNode;
		var rootNode: DescentParserNode = defaultLineParser.parseCmdLine(line, commands);
		if (rootNode.err && rootNode.firstCommand) {
			err = rootNode;
			rootNode = defaultLineParser.parseJS(line);
			runnable = executerVisitor.visit(rootNode);
			runnable.run(function (result) {
				if (result instanceof ErrorWrapper) {
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
			doneCB(rootNode);
		} else {
			runnable = executerVisitor.visit(rootNode);
			runnable.run(doneCB);
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
