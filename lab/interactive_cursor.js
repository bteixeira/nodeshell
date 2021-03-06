/**
 * Gives you power over your terminal like you never saw before.
 * Probably too much power...
 */

var nodeReadline = require('readline');
require('colors');

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

/*
keyHandler.bind('RETURN', function () {
    stdout.write('RETURN');
});

keyHandler.bind('ENTER', function () {
    stdout.write('ENTER');
});
*/

keyHandler.bind('CTRL+X', function () {
    stdin.once('data', function (data) {
        var coords = data.toString().slice(2).split(';').map(parseFloat);
        nodeReadline.cursorTo(stdout, 0, 0);
        stdout.write('POS:' + coords.join(';') + ' |');
        nodeReadline.cursorTo(stdout, coords[1] - 1, coords[0] - 1);
    });
    stdout.write('\033[6n');
});

function saveCursor() {
    stdout.write('\033[s');
}

keyHandler.bind('CTRL+S', saveCursor);

function restoreCursor() {
    stdout.write('\033[u');
}

keyHandler.bind('CTRL+R', restoreCursor);

keyHandler.bindDefault(function (ch, key) {
    if (ch && ch.length === 1) {
        stdout.write(ch);
        //stdout.write('string');
        //saveCursor();
        //stdout.write('\n');
        //forceRedraw();
        //restoreCursor();
        if (ch === '\n') {
            stdout.write('backslash-N');
        } else if (ch === '\r') {
            stdout.write('backslash-R');
        }
    }
});

function draw() {
    nodeReadline.cursorTo(stdout, 0, stdout.rows - 1);
    stdout.write(new Date().toString().black.whiteBG);
}
function safeDraw() {
    saveCursor();
    draw();
    restoreCursor();
}
safeDraw();
// var id = setInterval(safeDraw, 10000);

function forceRedraw() {
    clearInterval(id);
    draw();
    id = setInterval(safeDraw, 10000);
}