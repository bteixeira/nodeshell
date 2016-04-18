var lastActive;
var oldFooterHeight = 0;
var rl = require('readline');

module.exports = function Writer (stdout) {

    var parent;
    var content = [];
    var row = 1;
    var col = 1;
    var footer;

    // TODO SET PARENT ?

    var me = {
        setFooter: function (footer_) {
            footer = footer_;
        },
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
            var active = Writer.active;
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
            active.activate();
        },
        rewind: function () {
            rl.moveCursor(stdout, -col + 1, -row + 1);
        },
        activate: function () {
            var offsetThis = this.offset();
            var diff = 0;
            var active = Writer.active;
            if (!active) {
                // no active panel, this is the first time we're activating
                // cursor starts out at top left most
                rl.moveCursor(stdout, offsetThis[1], offsetThis[0]);
            } else if (this.isFooter() && !active.isFooter()) {
                saveCursor(stdout);
                lastActive = active;
                rl.cursorTo(stdout, offsetThis[1], stdout.rows - footer.getMinHeight() + offsetThis[0]);
                oldFooterHeight = footer.getMinHeight();
            } else {
                if (active.isFooter() && !this.isFooter()) {
                    restoreCursor(stdout);
                    active = lastActive;
                    diff = footer.getMinHeight() - oldFooterHeight;
                    //linesAdded = 0;
                }

                var offsetThat = active.offset();
                var delta = [offsetThis[0] - offsetThat[0], offsetThis[1] - offsetThat[1]];

                rl.moveCursor(stdout, delta[1], delta[0] - diff);

            }
            Writer.active = this;

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
            return parent.getChildOffsetH(this);
        },
        offset: function () {
            // RETURNS [row, col]
            var offset = parent.getChildOffset(this);
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

    return me;
};

function saveCursor(stdout) {
    stdout.write('\033[s');
}
function restoreCursor(stdout) {
    stdout.write('\033[u');
}
