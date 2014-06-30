var vm = require('vm');
var util = require('util');
var readline = require('readline');
var KeyHandler = require(__dirname + '/src/keyhandler');
var Commands = require(__dirname + '/src/commands');
var commands = new Commands();
var Parser = require(__dirname + '/src/parser/parser');
var Line = require(__dirname + '/src/line');
var Executer = require(__dirname + '/src/visitorExecuter');
var ErrorWrapper = require(__dirname + '/src/ErrorWrapper');
var History = require(__dirname + '/src/History');
require('colors');

var getPrompt = function () {
    /* Due to apparent bug in readline, if you want a new line before the prompt
     * you should print it directly. Otherwise when you press backspace an
     * aditional new line will be printed. */
    console.log();
    return process.cwd() + '$ ';
};

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
    require: require
};

var history = new History(line);

process.on('SIGINT', function() {
//    console.log('Do something useful here.');
//    server.close();
});

var extend = util._extend;

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
    extend(ctx, permanent);
    line.setPrompt(getPrompt());
    line._refreshLine();
}

var executer = new Executer(commands, ctx);

var line = new Line({
    output: process.stdout,
    acceptCB: function (line) {
            var ast = parser.parse(line);
            executer.visit(ast, doneCB);
    }
});
var parser = new Parser(
    commands
);

var history = new History(line);

var stdin = process.stdin;

readline.emitKeypressEvents(stdin);

stdin.setRawMode(true);

var keyHandler = new KeyHandler({
    line: line,
    history: history
});

function runUserFile () {
    console.log('this is supposed to read and execute user scripts');
}
runUserFile();

line.setPrompt(getPrompt());
line._refreshLine();

stdin.on('keypress', function (ch, key) { return keyHandler.handleKey(ch, key); });

