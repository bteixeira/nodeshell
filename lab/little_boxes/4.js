/* Have a prompt that has two footers that may grow indefinitely */

var stdout = process.stdout;
var stdin = process.stdin;

stdin.setRawMode(true);

require('colors');

var rl = require('readline');

rl.moveCursor(stdout, -stdout.columns, 0);

var KeyHandler = require('../../src/keyhandler');
var keyHandler = new KeyHandler(stdin);

keyHandler.bind('CTRL+C', function () {
    rl.moveCursor(stdout, -stdout.columns, 0);
    rl.clearScreenDown(stdout);
    process.exit(0);
});

keyHandler.bindDefault(function (ch, key) {
    if (ch && ch.length === 1) {
        panels[active].insert(ch);
    }
});




keyHandler.bind('TAB', function (ch, key) {
    switchPanel();
});

var panels = [];
var active = 0;

function switchPanel() {
    var a = (active + 1) % panels.length;
    panels[a].activate();
}
function insert (ch, skip) {
    if (!this._content) {
        this._content = [];
    }
    if (ch.charCodeAt(0) === 127) {
        if (this._col > 1) {
            stdout.write(ch);
            stdout.write(' ');
            stdout.write(ch);
            this._col -= 1;
            this._content.splice(this._content.length - 1, 1);
        }
    } else {
        stdout.write(ch);
        if (!skip) {
            this._content.push(ch);
            this._col += 1;
        }
        if (this._col > this.width()) {
            stdout.write(new Array(this.afterSpace() + 2).join('\n'));
            rl.moveCursor(stdout, this.offsetH(), -this.afterSpace());
            stdout.write('\033[K');
            //drawFooter();
            if (!skip) {
                this._col = 1;
                this._row += 1;
                if (this === panels[0] || this === panels[1]) {
                    panels[2].rewrite();
                    panels[3].rewrite();
                } else if (this === panels[2]) {
                    panels[3].rewrite();
                }
            }
        }
    }
}
function rewrite () {
    if (!this._content) {
        this._content = [];
    }
    var a = active;
    this.activate();
    this.rewind();
    var me = this;
    this._content.forEach(function (ch) {
        me.insert(ch, true); // TODO REWRITE ITSELF WAS TRIGGERED BY AN insert ON ANOTHER PANEL, WILL THIS EVER CAUSE A LOOP?
    });
    stdout.write('\033[K');
    panels[a].activate();
}

// panel 0, top left
panels.push({
    _row: 1,
    _col: 1,
    activate: function () {
        panels[active].rewind();
        if (active === 1) {
            rl.moveCursor(stdout, -this.width(), 0);
        } else if (active === 2) {
            rl.moveCursor(stdout, 0, -this.height());
        } else if (active === 3) {
            rl.moveCursor(stdout, 0, -this.height() - panels[2].height());
        }
        rl.moveCursor(stdout, this._col - 1, this._row - 1);
        active = 0;
    },
    rewind: function () {
        rl.moveCursor(stdout, -this._col + 1, -this._row + 1);
    },
    offsetH: function () {
        return 0;
    },
    width: function () {
        return 40;
    },
    height: function () {
        return Math.max(this._row, panels[1]._row);
    },
    insert: insert,
    rewrite: rewrite,
    afterSpace: function () {
        return panels[2].height() + panels[3].height();
    }
});

// panel 1, top right
panels.push({
    _row: 1,
    _col: 1,
    activate: function () {
        panels[active].rewind();
        if (active === 0) {
            rl.moveCursor(stdout, panels[0].width(), 0);
        } else if (active === 2) {
            rl.moveCursor(stdout, panels[0].width(), -this.height());
        } else if (active === 3) {
            rl.moveCursor(stdout, panels[0].width(), -this.height() - panels[2].height());
        }
        rl.moveCursor(stdout, this._col - 1, this._row - 1);
        active = 1;
    },
    rewind: function () {
        rl.moveCursor(stdout, -this._col + 1, -this._row + 1);
    },
    offsetH: function () {
        return panels[0].width();
    },
    width: function () {
        return stdout.columns - panels[0].width();
    },
    height: function () {
        return Math.max(this._row, panels[0]._row);
    },
    insert: insert,
    rewrite: rewrite,
    afterSpace: function () {
        return panels[2].height() + panels[3].height();
    }
});

// panel 2, midle row
panels.push({
    _row: 1,
    _col: 1,
    activate: function () {
        panels[active].rewind();
        if (active === 0) {
            rl.moveCursor(stdout, 0, panels[0].height());
        } else if (active === 1) {
            rl.moveCursor(stdout, -panels[0].width(), panels[1].height());
        } else if (active === 3) {
            rl.moveCursor(stdout, 0, -this.height());
        }
        rl.moveCursor(stdout, this._col - 1, this._row - 1);
        active = 2;
    },
    rewind: function () {
        rl.moveCursor(stdout, -this._col + 1, -this._row + 1);
    },
    offsetH: function () {
        return 0;
    },
    width: function () {
        return stdout.columns;
    },
    height: function () {
        return this._row;
    },
    insert: insert,
    rewrite: rewrite,
    afterSpace: function () {
        return panels[3].height();
    }
});

// panel 3, bottom row
panels.push({
    _row: 1,
    _col: 1,
    activate: function () {
        panels[active].rewind();
        if (active === 0) {
            rl.moveCursor(stdout, 0, panels[0].height() + panels[2].height());
        } else if (active === 1) {
            rl.moveCursor(stdout, -panels[0].width(), panels[1].height() + panels[2].height());
        } else if (active === 2) {
            rl.moveCursor(stdout, 0, panels[2].height());
        }
        rl.moveCursor(stdout, this._col - 1, this._row - 1);
        active = 3;
    },
    rewind: function () {
        rl.moveCursor(stdout, -this._col + 1, -this._row + 1);
    },
    offsetH: function () {
        return 0;
    },
    width: function () {
        return stdout.columns;
    },
    height: function () {
        return this._row;
    },
    insert: insert,
    rewrite: rewrite,
    afterSpace: function () {
        return 0;
    }
});
