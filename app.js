var vm = require('vm');
var readline = require('readline');
var KeyHandler = require(__dirname + '/src/keyhandler');
var Commands = require(__dirname + '/src/commands');
var commands = new Commands();
var Parser = require(__dirname + '/src/parser/parser');
var Line = require(__dirname + '/src/line');
var Executer = require(__dirname + '/src/visitorExecuter');

var getPrompt = function () {
    /* Due to apparent bug in readline, if you want a new line before the prompt
     * you should print it directly. Otherwise when you press backspace an
     * aditional new line will be printed. */
    console.log();
    return process.cwd() + '$ ';
};

var ctx = vm.createContext({
    process: process
});

var executer = new Executer(commands, ctx, function (result) {
    console.log(result);
    line.setPrompt(getPrompt());
    line._refreshLine();
});

var line = new Line({
    output: process.stdout,
    acceptCB: function (line) {
        try {
//            var result = parser.exec(line);
            var ast = parser.parse(line);
            executer.visit(ast);

        } catch (ex) {
            console.error(ex.toString());
        }
    }
});
var parser = new Parser({
    commands: commands
//    ,
//    cb: function () {
//        line.setPrompt(getPrompt());
//        line._refreshLine();
//    }
});
var stdin = process.stdin;

readline.emitKeypressEvents(stdin);

stdin.setRawMode(true);

var keyHandler = new KeyHandler({
    input: stdin,
    output: process.stdout,
    line: line
});

function runUserFile () {
    console.log('this is supposed to read and execute user scripts');
}
runUserFile();

line.setPrompt(getPrompt());
line._refreshLine();

stdin.on('keypress', function (ch, key) { return keyHandler.handleKey(ch, key); });
