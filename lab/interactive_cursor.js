/**
 * Gives you power over your terminal like you never saw before.
 * Probably too much power...
 */

var nodeReadline = require('readline');

var KeyHandler = require('../src/keyhandler');
var LineReader = require('../src/lineReader');

var stdout = process.stdout;

var keyHandler = new KeyHandler(process.stdin);

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
    nodeReadline.cursorTo(stdout, 0, 0);
});

keyHandler.bindDefault(function (ch, key) {
    if (ch && ch.length === 1) {
        stdout.write(ch);
    }
});
