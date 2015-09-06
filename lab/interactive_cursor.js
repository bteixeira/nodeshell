/**
 * Gives you power over your terminal like you never saw before.
 * Probably too much power...
 */

var nodeReadline = require('readline');

var KeyHandler = require('../src/keyhandler');

var stdout = process.stdout;
var stdin = process.stdin;

var keyHandler = new KeyHandler(stdin);

keyHandler.bind('UP', function () {
    nodeReadline.moveCursor(stdout, 0, -1);
});

keyHandler.bind('DOWN', function () {
    nodeReadline.moveCursor(stdout, 0, 1);
});

keyHandler.bind('LEFT', function () {
    nodeReadline.moveCursor(stdout, -1, 0);
});

keyHandler.bind('RIGHT', function () {
    nodeReadline.moveCursor(stdout, 1, 0);
});

keyHandler.bind('CTRL+C', function () {
    process.exit(0);
});

keyHandler.bind('CTRL+X', function () {
    stdin.once('data', function (data) {
        var coords = data.toString().slice(2).split(';').map(parseFloat);
        nodeReadline.cursorTo(stdout, 0, 0);
        stdout.write('POS:' + coords.join(';') + ' |');
        nodeReadline.cursorTo(stdout, coords[1] - 1, coords[0] - 1);
    });
    stdout.write('\033[6n');
});

keyHandler.bind('CTRL+S', function () {
    stdout.write('\033[s');
});

keyHandler.bind('CTRL+R', function () {
    stdout.write('\033[u');
});

keyHandler.bindDefault(function (ch, key) {
    if (ch && ch.length === 1) {
        stdout.write(ch);
    }
});
