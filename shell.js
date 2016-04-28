var vm = require('vm');
var util = require('util');
var path = require('path');
var KeyHandler = require('./src/keyhandler');
var Commands = require('./src/commands');
var LineReader = require('./src/lineReader');
var defaultCommands = require('./src/defaultCommands');

var fs = require('fs');

var DefaultParser = require('./src/parser/defaultLineParser');
var CompletionParser = require('./src/parser/completionParser');
var Executer = require('./src/parser/RunnableWrapperExecuterVisitor');

var ErrorWrapper = require('./src/errorWrapper');
var History = require('./src/history');
var utils = require('./src/utils');
require('colors');
var readline = require('readline');

var Writer = require('./src/panels/tree/writerPanel');

process.on('SIGINT', function () {
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

var lineReader = new LineReader(process.stdout);
var keyHandler = new KeyHandler(process.stdin);
var paused = false;

var permanent = {
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
            var ast = DefaultParser.parseCmdLine(body, commands);
            if (ast.err) {
                throw ast.err;
            }
            if (ast.type !== 'COMMAND') {
                throw 'Alias body must be a valid command name';
            }
            commands.addCommand(handle, function () {

            }, '[alias]');
        },
        home: __dirname
    }
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

var commands = defaultCommands(ctx);
commands = new Commands({
    parent: commands,
    skipPath: true
});
var executer = new Executer(commands, ctx);

lineReader
    .setPrompt(function () {
        return process.cwd() + ' \u2B21  '.green; // or \u2B22
    })
    .updatePrompt()
    .on('accept', function (line) {
        layout.separator.cursorTo(1, 1);
        layout.separator.clearScreenDown();
        layout.sidebar.cursorTo(1, 1);
        layout.sidebar.clearScreenDown();

        process.stdin.setRawMode(false);
        process.stdin.pause();
        readline.clearScreenDown(process.stdout);
        paused = true;
        var runner, err;
        var ast = DefaultParser.parseCmdLine(line, commands);
        if (ast.err && ast.firstCommand) {
            err = ast;
            ast = DefaultParser.parseJS(line);
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
    CompletionParser.parseCmdLine(lineReader, commands);
}
require('./src/defaultCmdConfig')(CompletionParser);
require('./src/defaultKeys')(keyHandler, lineReader, history, complete);


function runUserFile () {
    var NSH_FILE = '.nsh.js';
    var home = utils.getUserHome();
    utils.sourceSync(path.join(home, NSH_FILE), ctx);
    utils.sourceSync(path.join('.', NSH_FILE), ctx);
}
runUserFile();

var LayoutComposer = require('./src/panels/composer');
var layout = LayoutComposer.buildInit({
    cols: [
        {
            width: 'auto',
            name: 'prompt'
        }, {
            name: 'separator',
            width: 3
        }, {
            width: 40,
            name: 'sidebar'
        }
    ]
}, process.stdout);

lineReader.setWriter(layout.prompt);

layout.separator.setRedraw(function () {
    this.write(' \u2502  \u2502  \u2502  \u2502  \u2502'.blue);
});
layout.separator.rewrite();
layout.sidebar.setRedraw(function () {
    var me = this;
    fs.readdir('.', function (err, files) {
        if (err) {
            me.write(err.toString().red);
        } else {
            if (files.length <= 5) {
                me.write(files.join('\n') + '\n');
            } else {
                me.write(files.slice(0, 4).join('\n') + '\n');
                me.write('  (' + (files.length - 4) + ' more...)')
            }
        }
    });
});
layout.sidebar.rewrite();


lineReader.refreshLine();
