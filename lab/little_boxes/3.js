/* Have a prompt that always reserves enough space for a footer and has a sidebar ON EACH SIDE */

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

//var cursor = 1;

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
    } else if (activePanel === panel2) {
        panel3.activate();
    } else {
        panel1.activate();
    }
}

var proto = {
    rewind: function () {
        rl.moveCursor(stdout, -this._col + 1, -this._row + 1);
    },
    insert: function (ch) {
        stdout.write(ch);
        if (ch.charCodeAt(0) === 127) {
            this._col -= 1;
            if (this._col < 1) {
                this._col = 1;
            }
        } else {
            this._col += 1;
            if (this._col > this.width()) {
                this._col = 1;
                this._row += 1;
                stdout.write(new Array(footerHeight + 2).join('\n'));
                rl.moveCursor(stdout, this.offsetH(), -footerHeight);
                stdout.write('\033[K');
                drawFooter();
            }
        }
    }
};

var panel1 = (function () {
    return {
        _row: 1,
        _col: 1,
        activate: function () {
            activePanel.rewind();
            if (activePanel === panel2) {
                rl.moveCursor(stdout, - this.width(), 0);
            } else if (activePanel === panel3) {
                rl.moveCursor(stdout, - (this.width() + panel2.width()), 0);
            }
            this._row = this._col = 1;
            activePanel = this;
        },
        rewind: proto.rewind,
        offsetH: function () {
            return 0;
        },
        width: function () {
            return 20;
        },
        insert: proto.insert
    };
}());
var panel2 = (function () {
    return {
        _row: 1,
        _col: 1,
        activate: function () {
            activePanel.rewind();
            rl.moveCursor(stdout, -this.width(), 0);
            if (activePanel === panel1) {
                rl.moveCursor(stdout, panel1.width(), 0);
            } else if (activePanel === panel3) {
                rl.moveCursor(stdout, - this.width(), 0);
            }
            this._row = this._col = 1;
            activePanel = this;
        },
        rewind: proto.rewind,
        offsetH: function () {
            return panel1.width();
        },
        width: function () {
            return stdout.columns - panel1.width() - panel3.width();
        },
        insert: proto.insert
    };
}());
var panel3 = (function () {
    return {
        _row: 1,
        _col: 1,
        activate: function () {
            activePanel.rewind();
            if (activePanel === panel1) {
                rl.moveCursor(stdout, panel1.width() + panel2.width(), 0);
            } else if (activePanel === panel2) {
                rl.moveCursor(stdout, panel2.width(), 0);
            }
            this._row = this._col = 1;
            activePanel = this;
        },
        rewind: proto.rewind,
        offsetH: function () {
            return panel1.width() + panel2.width();
        },
        width: function () {
            return 60;
        },
        insert: proto.insert
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