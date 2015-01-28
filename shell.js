var vm = require('vm');
var util = require('util');
var path = require('path');
var KeyHandler = require('./src/keyhandler');
var Commands = require('./src/commands');
var LineReader = require('./src/lineReader');
var defaultCommands = require('./src/defaultCommands');

//var Parser = require('./src/parser/parser');
var Parser = require('./src/parser/descent');
//var Executer = require('./src/ast/visitors/visitorExecuter');
var Executer = require('./src/parser/RunnableWraperApproach');

var ErrorWrapper = require('./src/errorWrapper');
var History = require('./src/history');
var Autocompleter = require('./src/autocompleter');
var NodeLiteral = require('./src/ast/nodes/nodeLiteral');
var utils = require('./src/utils');
require('colors');

process.on('SIGINT', function () {
    console.log('\nSIGINT\n');
    lineReader.refreshLine();
});

var lineReader = new LineReader(process.stdout);
var keyHandler = new KeyHandler(process.stdin);

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
        alias: function (handle, body) {
//            console.log('aliasing', handle, body);
            commands.addCommand(handle, function (cb, args) {
//                console.log('running aliased');
                var ast = parser.parse(body);
                args = args.map(function (arg) {
                    return new NodeLiteral(arg);
                });
                // assume it's a command
                ast.args = ast.args.concat(args); // TODO STRING vs NODE?
                executer.visit(ast, cb);
            });
        }
    }
};

//process.on('SIGINT', function() {
//});

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
        var runner, err;
        var ast = parser.parseCmdLine(line);
        if (ast.err && ast.firstCommand) {
            err = ast;
            ast = parser.parseJS(line);
            runner = executer.visit(ast);
            runner.run(function (result) {
                if (result instanceof ErrorWrapper) {
                    // Magic! If line is ambiguous and could have been both a command and JS, but both errored, show both errors
                    console.log(inspect(err));
                }
                doneCB(result);

            });
        } else {
            runner = executer.visit(ast);
            runner.run(doneCB);
        }
    });

/**/
var parser = new Parser(
    commands
);
/**/

var history = new History(lineReader);

var autocompleter = new Autocompleter(lineReader, ctx, commands);
require('./src/defaultKeys')(keyHandler, lineReader, history, autocompleter);


function runUserFile () {
    var NSH_FILE = '.nsh.js';
    var home = utils.getUserHome();
    utils.sourceSync(path.join(home, NSH_FILE), ctx);
    utils.sourceSync(path.join('.', NSH_FILE), ctx);
}
runUserFile();

lineReader.refreshLine();
