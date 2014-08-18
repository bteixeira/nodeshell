var vm = require('vm');
var util = require('util');
var readline = require('readline');
var KeyHandler = require('./src/keyhandler');
var Commands = require('./src/commands');
var Parser = require('./src/parser/parser');
var LineReader = require('./src/lineReader');
var Executer = require('./src/ast/visitors/visitorExecuter');
var ErrorWrapper = require('./src/errorWrapper');
var History = require('./src/history');
var Autocompleter = require('./src/autocompleter');
var utils = require('./src/utils');
require('colors');

var getPrompt = function () {
    return process.cwd() + ' \u2B21  '.green; // or \u2B22
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

process.on('SIGINT', function() {
//    console.log('Do something useful here.');
//    server.close();
});

var extend = util._extend;

var ctx = vm.createContext(permanent);
ctx.prompt = getPrompt;

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
    if (!ctx.prompt) {
        ctx.prompt = getPrompt;
    }
    if (typeof ctx.prompt === 'function') {
        line.setPrompt(ctx.prompt());
    } else {
        line.setPrompt(String(ctx.prompt));
    }
    line.refreshLine();
}

var commands = new Commands(ctx);
var executer = new Executer(commands, ctx);

var line = new LineReader(process.stdout);
line.on('accept', function (line) {
    var ast = parser.parse(line);
    executer.visit(ast, doneCB);
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
    history: history,
    autocompleter: new Autocompleter(line, ctx, commands)
});

function runUserFile () {
    var NSH_FILE = '.nsh.js';
    var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    utils.sourceSync(home + '/' + NSH_FILE, ctx);
    utils.sourceSync('./' + NSH_FILE, ctx);
}
runUserFile();

line.setPrompt(ctx.prompt());
line.refreshLine();

stdin.on('keypress', function (ch, key) { return keyHandler.handleKey(ch, key); });
