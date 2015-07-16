var vm = require('vm');
var util = require('util');
var path = require('path');
var KeyHandler = require('./src/keyhandler');
var Commands = require('./src/commands');
var LineReader = require('./src/lineReader');
var defaultCommands = require('./src/defaultCommands');

var DefaultParser = require('./src/parser/defaultLineParser');
var CompletionParser = require('./src/parser/completionParser');
var Executer = require('./src/parser/RunnableWrapperExecuterVisitor');

var ErrorWrapper = require('./src/errorWrapper');
var History = require('./src/history');
var Autocompleter = require('./src/autocompleter');
var NodeLiteral = require('./src/ast/nodes/nodeLiteral');
var utils = require('./src/utils');
require('colors');

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
    NSH: {
        lineReader: lineReader,
        bindings: keyHandler,
        utils: utils,
        completion: CompletionParser,
//        alias: function (handle, body) {
            // TODO implement aliases again
//        }
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
        process.stdin.setRawMode(false);
        process.stdin.pause();
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

/**/
//var parser = new DefaultParser(
//    commands
//);
/**/

var history = new History(lineReader);

var autocompleter = new Autocompleter(lineReader, ctx, commands);
function complete () {
    CompletionParser.parseCmdLine(lineReader, commands);
}
require('./src/defaultCmdConfig')(CompletionParser);
//require('./src/defaultKeys')(keyHandler, lineReader, history, autocompleter);
require('./src/defaultKeys')(keyHandler, lineReader, history, complete);


function runUserFile () {
    var NSH_FILE = '.nsh.js';
    var home = utils.getUserHome();
    utils.sourceSync(path.join(home, NSH_FILE), ctx);
    utils.sourceSync(path.join('.', NSH_FILE), ctx);
}
runUserFile();

lineReader.refreshLine();
