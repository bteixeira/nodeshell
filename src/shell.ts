import * as vm from 'vm';
import * as util from 'util';
import * as path from 'path';

import KeyHandler from './keyhandler';
import {Commands} from './commands';
import LineReader from './lineReader';
import createDefaultCommands from './createDefaultCommands';

import * as defaultLineParser from './parser/defaultLineParser';
import * as CompletionParser from './parser/completionParser';
import Executer from './parser/RunnableWrapperExecuterVisitor';

import LayoutComposer from './panels/composer';

import ErrorWrapper from './errorWrapper';
import History from './history';
import * as utils from './utils';
import 'colors';
import * as readline from 'readline';

var paused: boolean = false;

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

const lineReader: LineReader = new LineReader(process.stdout);
const keyHandler: KeyHandler = new KeyHandler(process.stdin);

function setLayout (spec) {
    // TODO validate spec according to high-level strict rules
    layout = LayoutComposer.buildInit(spec, process.stdout);
    lineReader.setWriter(layout.prompt);
    permanent.nsh.layout = layout; // Not so permanent after all...
}

const permanent = {
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
        alias: function (handle, body) {
            var ast = defaultLineParser.parseCmdLine(body, commands);
            if (ast.err) {
                throw ast.err;
            }
            if (ast.type !== 'COMMAND') {
                throw 'Alias body must be a valid command name';
            }
            commands.addCommand(handle, function () {

            }, '[alias]');
        },
        home: __dirname,
        setLayout: setLayout,
        on: function (event, cb) {
            // TODO
        },
		layout: null,
    },
};

var extend = utils.extend;

var ctx = vm.createContext(permanent);

var inspect = function (what) {
    if (what instanceof ErrorWrapper) {
        return what.toString().red;
    } else {
        return util.inspect.call(this, what, {colors: true});
    }
};

function doneCB (result) {
    console.log(inspect(result));
    // TODO MAKE READ-ONLY PROPERTIES INSTEAD
    extend(ctx, permanent);
    layout.reset();
    layout.reserveSpace();
    layout.rewrite();
    lineReader.refreshLine();
    process.stdin.resume();
    process.stdin.setRawMode(true);
    paused = false;
}

var commands: Commands = createDefaultCommands(ctx);
commands = new Commands({
    parent: commands,
    skipPath: true
});
var executer = new Executer(commands, ctx);

lineReader
    .setPrompt(function () {
        // Sets the default prompt TODO MOVE THIS INSIDE THE LINEREADER
        return process.cwd() + ' \u2B21  '.green; // or \u2B22
    })
    .updatePrompt()
    .on('accept', function (line: string) {
        layout.writers.forEach(function (writer) {
            if (writer !== layout.prompt) {
                writer.cursorTo(1, 1);
                writer.clearScreenDown();
            }
        });

        process.stdin.setRawMode(false);
        process.stdin.pause();
        readline.clearScreenDown(process.stdout);
        paused = true;
        var runner, err;
        var ast = defaultLineParser.parseCmdLine(line, commands);
        if (ast.err && ast.firstCommand) {
            err = ast;
            ast = defaultLineParser.parseJS(line);
            runner = executer.visit(ast);
            runner.run(function (result) {
                if (result instanceof ErrorWrapper) {
                    // Magic! If line is ambiguous and could have been both a command and JS, but both errored, show both errors
                    console.log(inspect(err));
                }
                doneCB(result);
            });
        } else if (ast.err) {
            doneCB(ast);
        } else {
            runner = executer.visit(ast);
            runner.run(doneCB);
        }
    });

var history = new History(lineReader);

function complete () {
    CompletionParser.parseCmdLine(lineReader, commands, layout.completions);
}
import defaultCmdConfig from './defaultCmdConfig';
defaultCmdConfig(CompletionParser);
require('./defaultKeys')(keyHandler, lineReader, history, complete);


var layout;

setLayout({name: 'prompt'});

function runUserFile () {
    var NSH_FILE = '.nsh.js';
    var home = utils.getUserHome();
    utils.sourceSync(path.join(home, NSH_FILE), ctx);
    utils.sourceSync(path.join('.', NSH_FILE), ctx);
}
runUserFile();

layout.writers.forEach(function (writer) {
    if (writer !== layout.prompt) {
        writer.rewrite();
    }
});

lineReader.refreshLine();
lineReader.on('change', function () {
    CompletionParser.parseCmdLine(lineReader, commands, layout.completions, false);
});
