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
        //stdout.write(ch);
        //cursor += 1;
        //if (cursor > (stdout.columns - sidebarWidth)) {
        //    cursor -= (stdout.columns - sidebarWidth);
        //    stdout.write(new Array(footerHeight + 2).join('\n'));
        //    rl.moveCursor(stdout, 0, -footerHeight);
        //    stdout.write('\033[K');
        //    drawFooter();
        //}
        activePanel.insert(ch);
    }
});

//keyHandler.bind('BACKSPACE', function (ch, key) {
//    if (ch && ch.length === 1) {
//        stdout.write(ch);
//        cursor -= 1;
//        if (cursor < 1) {
//            cursor = 1;
//        }
//    }
//});

keyHandler.bind('TAB', function (ch, key) {
    switchPanel();
});


function switchPanel() {
    if (activePanel === panel1) {
        panel2.activate();
    } else {
        panel1.activate();
    }
}

var panel1 = (function () {
    var row = 1;
    var col = 1;
    return {
        activate: function () {
            panel2.rewind();
            rl.moveCursor(stdout, -this.width(), 0);
            row = col = 1;
            activePanel = this;
        },
        rewind: function () {
            rl.moveCursor(stdout, -col + 1, -row + 1);
        },
        width: function () {
            return stdout.columns - panel2.width();
        },
        insert: function (ch) {
            stdout.write(ch);
            if (ch.charCodeAt(0) === 127) {
                col -= 1;
                if (col < 1) {
                    col = 1;
                }
            } else {
                col += 1;
                if (col > this.width()) {
                    col = 1;
                    row += 1;
                    stdout.write(new Array(footerHeight + 2).join('\n'));
                    rl.moveCursor(stdout, 0, -footerHeight);
                    stdout.write('\033[K');
                    drawFooter();
                }
            }
        }
    };
}());
var panel2 = (function () {
    var row = 1;
    var col = 1;
    return {
        activate: function () {
            panel1.rewind();
            rl.moveCursor(stdout, panel1.width(), 0);
            row = col = 1;
            activePanel = this;
        },
        rewind: function () {
            rl.moveCursor(stdout, -col + 1, -row + 1);
        },
        width: function () {
            return 60;
        },
        insert: function (ch) {
            stdout.write(ch);
            if (ch.charCodeAt(0) === 127) {
                col -= 1;
                if (col < 1) {
                    col = 1;
                }
            } else {
                col += 1;
                if (col > this.width()) {
                    col = 1;
                    row += 1;
                    stdout.write(new Array(footerHeight + 2).join('\n'));
                    rl.moveCursor(stdout, panel1.width(), -footerHeight);
                    stdout.write('\033[K');
                    drawFooter();
                }
            }
        }
    };
}());
var activePanel = panel1;

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