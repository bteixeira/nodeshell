
var readline = require('readline');
var KeyHandler = require(__dirname + '/src/keyhandler');
var Commands = require(__dirname + '/src/commands');
var commands = new Commands();
var Parser = require(__dirname + '/src/parser');
var Line = require(__dirname + '/src/line');

var line = new Line({
    output: process.stdout,
    acceptCB: function (line) {
        try {
            var result = parser.exec(line);
            console.log(result);
        } catch (ex) {
            console.error(ex.toString());
        }
        this._refreshLine();
    }
});
var parser = new Parser({
    commands: commands
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

line._refreshLine();

stdin.on('keypress', function (ch, key) { return keyHandler.handleKey(ch, key); });
