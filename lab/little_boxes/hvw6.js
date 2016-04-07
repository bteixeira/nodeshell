/* Yet another iteration */
/* FIXED: Seems that panel refreshing is working! */
/* NEED TO FIX: ? */

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
        //writers[active].insert(ch);
        active.insert(ch);
    }
});


keyHandler.bind('TAB', function (ch, key) {
    switchPanel();
});

var writers = [];
var activeI = 0;
function switchPanel() {
    activeI = (activeI + 1) % writers.length;
    writers[activeI].activate();
}
var active;
var lastActive;
//var linesAdded = 0;
var oldFooterHeight = 0;

var Center = function (panel) {
    //var panel;
    var me = {
        getOffset: function (child) {
            return [this.getOffsetV(child), this.getOffsetH(child)];
        },
        getOffsetH: function (child) {
            return 0;
        },
        getOffsetV: function (child) {
            return 0;
        },
        getWidth: function (child) {
            return stdout.columns;
        },
        getHeight: function (child) {
            this.getMinHeight();
        },
        getAfterSpace: function (child) {
            return footer.getMinHeight();
            //return 0;
        },
        getMinHeight: function () {
            return panel.getMinHeight();
        },
        isFooter: function () {
            return false;
        },
        reserveSpace: function () {
            var totalHeight = this.getMinHeight() + this.getAfterSpace(null);
            stdout.write(new Array(totalHeight).join('\n'));
            rl.moveCursor(stdout, 0, -totalHeight + 1);
        },
        drawBelow: function () {
            footer.rewrite();
        },
        rewrite: function () {
            panel.rewrite();
        }
    };
    panel.setParent(me);
    return me;
};

var Footer = function (panel) {
    //var panel;
    var me = {
        getOffset: function (child) {
            return [this.getOffsetV(child), this.getOffsetH(child)];
        },
        getOffsetH: function (child) {
            return 0;
        },
        getOffsetV: function (child) {
            //throw('I DONT KNOW HOW TO SOLVE THIS YET');
            return 0;
        },
        getWidth: function (child) {
            return stdout.columns;
        },
        getHeight: function (child) {
            return this.getMinHeight();
        },
        getAfterSpace: function (child) {
            return 0;
        },
        getMinHeight: function () {
            return panel.getMinHeight();
        },
        isFooter: function () {
            return true;
        },
        drawBelow: function () {
        },
        rewrite: function () {
            panel.rewrite();
        }
    };
    panel.setParent(me);
    return me;
};

var Columns = function (children, layout) {

    var parent;
    //var children = [];
    //var layout = [];

    // TODO ADD PANELS ACCORDING TO GIVEN LAYOUT

    var me = {
        getOffset: function (child) {
            return [this.getOffsetV(child), this.getOffsetH(child)];
        },
        getOffsetH: function (child) {

            var lt;
            var sum = 0;
            var autoFound = false;
            var childFound = false;
            var sumBefore;
            for (var i = 0; i < children.length; i++) {
                lt = layout[i];
                if (child === children[i]) {
                    if (!autoFound) {
                        return sum + parent.getOffsetH(this);
                    }
                    childFound = true;
                    sumBefore = sum;
                    sum += lt;
                } else {
                    if (lt === 'auto') {
                        autoFound = true;
                    } else {
                        sum += lt;
                    }
                }
            }

            // still here, there is an auto child before the child we're calculating
            return parent.getOffsetH(this) + sumBefore + (parent.getWidth(this) - sum);

        },
        getOffsetV: function (child) {
            return parent.getOffsetV(this);
        },
        getWidth: function (child) {
            var sum = 0;
            //var auto = false;
            //children.forEach(function (ch, i) {
            for (var i = 0; i < children.length; i++) {
                var lt = layout[i];
                if (child === children[i]) {
                    if (lt !== 'auto') {
                        return lt;
                    }
                } else {
                    if (lt !== 'auto') {
                        sum += lt;
                    }
                }
            }

            // still here, so this is the auto child
            return parent.getWidth(this) - sum;
        },
        getHeight: function (child) {
            return this.getMinHeight();
        },
        getAfterSpace: function (child) {
            return (this.getMinHeight() - child.getMinHeight()) + parent.getAfterSpace(this);
        },
        getMinHeight: function () {
            var max = 0;
            children.forEach(function (child) {
                if (child.getMinHeight() > max) {
                    max = child.getMinHeight();
                }
            });
            return max;
        },
        setParent: function (parent_) {
            parent = parent_;
        },
        isFooter: function () {
            return parent.isFooter();
        },
        drawBelow: function (child) {
            // TODO MUST CLEAN BOTTOM LINE OF SIBLINGS
            var me = this;
            var h = this.getMinHeight();
            children.forEach(function (ch) {
                //h = ch.height(); // TODO ISN'T THIS me.getMinHeight() ???
                if (ch !== child && ch.getMinHeight() < h) {
                    // CALCULATE OFFSET BETWEEN ACTIVE AND LAST ROW OF ch, USING LOGIC FROM activate() (HARDEST PART IS SWITCHES BETWEEN FOOTER AND CENTER, DOES THAT EVER HAPPEN? I THINK NOT, CONFIRM)
                    var offsetThis = me.getOffset(ch);
                    var offsetThat = active.offset();
                    var delta = [offsetThis[0] - offsetThat[0], offsetThis[1] - offsetThat[1]];
                    // MAKE JUMP
                    rl.moveCursor(stdout, delta[1], delta[0] + h - 1);
                    // WRITE FULL LINE OF SPACES ACCORDING TO ch'S WIDTH
                    stdout.write(new Array(ch.width() + 1).join(' '));
                    // MAKE REVERSE JUMP BACK TO ACTIVE, BASED ON PREVIOUS OFFSET PLUS ch'S WIDTH
                    rl.moveCursor(stdout, -delta[1]-ch.width()
                        +
                        (
                            // if this panel is on the right edge of the screen, the cursor is actually one character behind
                            me.getOffsetH(ch) + ch.width() === stdout.columns ? 1 : 0
                        )
                        , -delta[0] - h + 1);
                }
            });
            parent.drawBelow(this);
        },
        rewrite: function () {
            children.forEach(function (child) {
                child.rewrite();
            });
        },
        width: function () {
            return this.getWidth(null);
        }
    };
    children.forEach(function (child) {
        child.setParent(me);
    });
    return me;
};

var Rows = function (children) {

    var parent;
    //var children = [];
    //var layout = [];

    // TODO ADD PANELS ACCORDING TO GIVEN LAYOUT

    var me = {
        getOffset: function (child) {
            return [this.getOffsetV(child), this.getOffsetH(child)];
        },
        getOffsetH: function (child) {
            return parent.getOffsetH(this);
        },
        getOffsetV: function (child) {
            var i;
            var sum = 0;
            for (i = 0; children[i] !== child && i < children.length; i++) {
                sum += children[i].getMinHeight();
            }
            return sum;
        },
        getWidth: function (child) {
            return parent.getWidth(this);
        },
        getHeight: function (child) {
            return child.getMinHeight();
        },
        getAfterSpace: function (child) {
            var i;
            for (i = 1; children[i - 1] !== child && i < children.length; i++) {
            }
            var sum = 0;
            for (; i < children.length; i++) {
                sum += children[i].getMinHeight();
            }
            sum += parent.getAfterSpace(this);
            return sum;
        },
        getMinHeight: function () {
            var sum = 0;
            children.forEach(function (child) {
                sum += child.getMinHeight();
            });
            return sum;
        },
        setParent: function (parent_) {
            parent = parent_;
        },
        isFooter: function () {
            return parent.isFooter();
        },
        drawBelow: function (child) {
            var found = false;
            children.forEach(function (ch) {
                if (found) {
                    ch.rewrite();
                }
                if (child === ch) {
                    found = true;
                }
            });
            parent.drawBelow(this);
        },
        rewrite: function () {
            children.forEach(function (child) {
                child.rewrite();
            });
        },
        width: function () {
            return this.getWidth(null);
        }
    };

    children.forEach(function (child) {
        child.setParent(me);
    });
    return me;
};

var Writer = function () {

    var parent;
    var content = [];
    var row = 1;
    var col = 1;

    // TODO SET PARENT ?

    var me = {
        insert: function (ch, skip) {
            if (ch.charCodeAt(0) === 127) {
                if (col > 1) {
                    stdout.write(ch);
                    stdout.write(' ');
                    stdout.write(ch);
                    col -= 1;
                    content.splice(content.length - 1, 1);
                }
            } else {
                stdout.write(ch);
                if (!skip) {
                    content.push(ch);
                }
                col += 1;
                if (col > this.width()) {
                    //var prevHeight = this.height();
                    //if (!skip) {
                        col = 1;
                        row += 1;
                    //}
                    stdout.write(new Array(this.afterSpace() + 2).join('\n'));
                    rl.moveCursor(stdout, this.offsetH(), -this.afterSpace());
                    if (!skip) {
                        stdout.write(new Array(this.width() + 1).join(' '));
                        rl.moveCursor(stdout, -this.width() +
                            (
                                // if this panel is on the right edge of the screen, the cursor is actually one character behind
                                this.offsetH() + this.width() === stdout.columns ? 1 : 0
                            )
                            , 0);
                        //if (this.isFooter() && this.height() > prevHeight) {
                        //    linesAdded += 1;
                        //}
                        // TODO MUST FIGURE OUT WHICH PANELS NEED TO REDRAW
                        parent.drawBelow(this);
                    }
                }
            }
        },
        rewrite: function () {
            var a = active;
            this.activate();
            this.rewind();
            var me = this;
            row = col = 1;
            content.forEach(function (ch) {
                me.insert(ch, true); // TODO rewrite ITSELF WAS TRIGGERED BY AN insert ON ANOTHER PANEL, WILL THIS EVER CAUSE A LOOP?
            });
            //stdout.write('\033[K');
            stdout.write(new Array(this.width() - col + 2).join(' '));
            rl.moveCursor(stdout, -this.width() + col - 1, 0);
            a.activate();
        },
        rewind: function () {
            rl.moveCursor(stdout, -col + 1, -row + 1);
        },
        activate: function () {
            var offsetThis = this.offset();
            var diff = 0;
            if (!active) {
                // no active panel, this is the first time we're activating
                // cursor starts out at top left most
                rl.moveCursor(stdout, offsetThis[1], offsetThis[0]);
            } else if (this.isFooter() && !active.isFooter()) {
                saveCursor();
                lastActive = active;
                rl.cursorTo(stdout, offsetThis[1], stdout.rows - footer.getMinHeight() + offsetThis[0]);
                oldFooterHeight = footer.getMinHeight();
            } else {
                if (active.isFooter() && !this.isFooter()) {
                    restoreCursor();
                    active = lastActive;
                    diff = footer.getMinHeight() - oldFooterHeight;
                    //linesAdded = 0;
                }

                var offsetThat = active.offset();
                var delta = [offsetThis[0] - offsetThat[0], offsetThis[1] - offsetThat[1]];

                rl.moveCursor(stdout, delta[1], delta[0] - diff);

            }
            active = this;

        },
        width: function () {
            return parent.getWidth(this);
        },
        height: function () {
            return parent.getHeight(this);
        },
        afterSpace: function () {
            return parent.getAfterSpace(this);
        },
        offsetH: function () {
            return parent.getOffsetH(this);
        },
        offset: function () {
            // RETURNS [row, col]
            var offset = parent.getOffset(this);
            return [offset[0] + row - 1, offset[1] + col - 1];
        },
        getMinHeight: function () {
            return row;
        },
        setParent: function (parent_) {
            parent = parent_;
        },
        isFooter: function () {
            return parent.isFooter();
        }
    };

    writers.push(me);
    return me;
};


function saveCursor() {
    stdout.write('\033[s');
}
function restoreCursor() {
    stdout.write('\033[u');
}





var w1 = new Writer();
var w2 = new Writer();
var w3 = new Writer();
var w4 = new Writer();
var w5 = new Writer();
var w6 = new Writer();
var rowsTop = new Rows([w2, w1, w3]);
var colsTop = new Columns([w4, rowsTop, w5, w6], [20, 40, 'auto', 20]);
var center = new Center(colsTop);

var w11 = new Writer();
var w12 = new Writer();
var w13 = new Writer();
var w14 = new Writer();
var rowsBottom1 = new Rows([w11, w12]);
var rowsBottom2 = new Rows([w13, w14]);
var colsBottom = new Columns([rowsBottom2, rowsBottom1], [40, 'auto']);
var footer = new Footer(colsBottom);

center.reserveSpace();

activeI = 0;
//active = w1;
w1.activate();