/* First attempt at making a completely generic layout*/
// TODO LESSON LEARNED: THE ABSTRACTION BREAKS WHEN JUMPING TO AND FROM ("ACTIVATING") PANELS ON THE FOOTER; THIS IS BECAUSE
// THE OFFSET BETWEEN PANELS IN THE FOOTER AND IN THE CENTER CAN NOT BE KNOWN

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
            //return Footer.getMinHeight();
            return 0;
        },
        getMinHeight: function () {
            return panel.getMinHeight();
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
            throw('I DONT KNOW HOW TO SOLVE THIS YET');
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
            for (var i = 0 ; i < children.length ; i++) {
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
            for (var i = 0 ; i < children.length ; i++) {
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
            return parent.getAfterSpace(this);
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
        }
    };
    children.forEach(function (child) {
        child.setParent(me);
    });
    return me;
};

var Rows = function (children, layout) {

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
            for (i = 0 ; children[i] !== child && i < children.length ; i++) {
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
            for (i = 1 ; children[i - 1] !== child && i < children.length ; i++) {}
            var sum = 0;
            for (; i < children.length ; i++) {
                sum += children[i].getMinHeight();
            }
            sum += parent.getAfterSpace(this);
            return sum;
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
                    col += 1;
                }
                if (col > this.width()) {
                    stdout.write(new Array(this.afterSpace() + 2).join('\n'));
                    rl.moveCursor(stdout, this.offsetH(), -this.afterSpace());
                    stdout.write('\033[K');
                    //drawFooter();
                    if (!skip) {
                        col = 1;
                        row += 1;

                        // TODO MUST FIGURE OUT WHICH PANELS NEED TO REDRAW

                        //if (this === writers[0] || this === writers[1]) {
                        //    writers[2].rewrite();
                        //    writers[3].rewrite();
                        //} else if (this === writers[2]) {
                        //    writers[3].rewrite();
                        //}
                    }
                }
            }
        },
        rewrite: function () {
            var a = active;
            this.activate();
            this.rewind();
            var me = this;
            content.forEach(function (ch) {
                me.insert(ch, true); // TODO rewrite ITSELF WAS TRIGGERED BY AN insert ON ANOTHER PANEL, WILL THIS EVER CAUSE A LOOP?
            });
            stdout.write('\033[K');
            writers[a].activate();
        },
        rewind: function () {
            rl.moveCursor(stdout, col + 1, row + 1);
        },
        activate: function () {
            //writers[active].rewind();
            //active.rewind();
            //if (active === 1) {
            //    rl.moveCursor(stdout, -this.width(), 0);
            //} else if (active === 2) {
            //    rl.moveCursor(stdout, 0, -this.height());
            //} else if (active === 3) {
            //    rl.moveCursor(stdout, 0, -this.height() - writers[2].height());
            //}
            //var delta = parent.getOffset(active, this);

            var offsetThis = this.offset();
            var offsetThat = active.offset();
            var delta = [offsetThis[0] - offsetThat[0], offsetThis[1] - offsetThat[1]];

            //rl.moveCursor(stdout, this._col - 1, this._row - 1);
            rl.moveCursor(stdout, delta[1], delta[0]);
            //active = 0;
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
        }
    };

    writers.push(me);
    return me;
};


// single row with two cols
/*
var w1 = new Writer();
var w2 = new Writer();
var cols = new Columns([w1, w2], [20, 'auto']);
var center = new Center(cols);

activeI = 0;
active = w1;
w1.activate();
*/



// single row with six cols

var w1 = new Writer();
var w2 = new Writer();
var w3 = new Writer();
var w4 = new Writer();
var w5 = new Writer();
var w6 = new Writer();
var cols = new Columns([w1, w2, w3, w4, w5, w6], [20, 20, 20, 'auto', 20, 20]);
var center = new Center(cols);

activeI = 0;
active = w1;
w1.activate();