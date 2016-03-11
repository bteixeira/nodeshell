/* Have a prompt that always reserves enough space for a footer and has a sidebar */

var stdout = process.stdout;
var stdin = process.stdin;

stdin.setRawMode(true);

require('colors');

var rl = require('readline');
var footerHeight = 3;
rl.moveCursor(stdout, -stdout.columns, 0);
rl.clearScreenDown(stdout);
stdout.write(new Array(footerHeight + 2).join('\n'));
rl.moveCursor(stdout, 0, -footerHeight);

var cursor = 1;

var KeyHandler = require('../../src/keyhandler');
var keyHandler = new KeyHandler(stdin);

keyHandler.bind('CTRL+C', function () {
    rl.moveCursor(stdout, -stdout.columns, 0);
    rl.clearScreenDown(stdout);
    process.exit(0);
});

keyHandler.bindDefault(function (ch, key) {
    if (ch && ch.length === 1) {
        stdout.write(ch);
        cursor += 1;
        if (cursor > (stdout.columns - sidebarWidth)) {
            cursor -= (stdout.columns - sidebarWidth);
            stdout.write(new Array(footerHeight + 2).join('\n'));
            rl.moveCursor(stdout, 0, -footerHeight);
            stdout.write('\033[K');
            drawFooter();
        }
    }
});

keyHandler.bind('BACKSPACE', function (ch, key) {
    if (ch && ch.length === 1) {
        stdout.write(ch);
        cursor -= 1;
        if (cursor < 1) {
            cursor = 1;
        }
    }
});





function drawFooter() {
    saveCursor();
    rl.cursorTo(stdout, 0, stdout.rows - footerHeight);
    stdout.write(new Array(stdout.columns + 1).join(' ').redBG);
    stdout.write(new Date().toString().black.redBG);
    stdout.write('\n');
    stdout.write(new Array(stdout.columns + 1).join(' ').redBG);
    restoreCursor();
}
drawFooter();
var id = setInterval(drawFooter, 1000);


var sidebarWidth = 60;




function saveCursor() {
    stdout.write('\033[s');
}
function restoreCursor() {
    stdout.write('\033[u');
}