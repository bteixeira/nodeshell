var lastActive;
var oldFooterHeight = 0;
var rl = require('readline');

module.exports = function Writer (stdout) {

    var parent;
    var content = [];
    var row = 1;
    var col = 1;
    var footer;

    var me = {
        setFooter: function (footer_) {
            footer = footer_;
        },
        insert: function (ch, skipChecks) {
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
                if (!skipChecks) {
                    content.push(ch);
                }
                col += 1;
                var width = parent.getChildWidth(this);
                var spaceBelow = parent.getSpaceBelowChild(this);
                var offsetH = parent.getChildOffsetH(this);
                if (col > width) {
                    col = 1;
                    row += 1;
                    stdout.write(new Array(spaceBelow + 2).join('\n'));
                    rl.moveCursor(stdout, offsetH, -spaceBelow);
                    if (!skipChecks) {
                        stdout.write(new Array(width + 1).join(' '));
                        rl.moveCursor(stdout, -width + (
                                // if this panel is on the right edge of the screen, the cursor is actually one character behind
                                offsetH + width === stdout.columns ? 1 : 0
                            ), 0);
                        parent.redrawBelowChild(this);
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
                me.insert(ch, true);
            });
            var width = parent.getChildWidth(this);
            var offsetH = parent.getChildOffsetH(this);
            stdout.write(new Array(width - col + 2).join(' '));
            rl.moveCursor(stdout, -width + col - (
                    // if this panel is on the right edge of the screen, the cursor is actually one character behind
                    offsetH + width === stdout.columns ? 0 : 1
                ), 0);
            active.activate();
        },
        rewind: function () {
            rl.moveCursor(stdout, -col + 1, -row + 1);
        },
        activate: function () {
            var offsetThis = this.getOffset();
            var diff = 0;
            var active = Writer.active;
            if (!active) {
                // no active panel, this is the first time we're activating
                // cursor starts out at top left most
                rl.moveCursor(stdout, offsetThis[1], offsetThis[0]);
            } else if (this.isFooter() && !active.isFooter()) {
                saveCursor(stdout);
                lastActive = active;
                rl.cursorTo(stdout, offsetThis[1], stdout.rows - footer.getHeight() + offsetThis[0]);
                oldFooterHeight = footer.getHeight();
            } else {
                if (active.isFooter() && !this.isFooter()) {
                    restoreCursor(stdout);
                    active = lastActive;
                    diff = footer.getHeight() - oldFooterHeight;
                }

                var offsetThat = active.getOffset();
                var delta = [offsetThis[0] - offsetThat[0], offsetThis[1] - offsetThat[1]];

                rl.moveCursor(stdout, delta[1], delta[0] - diff);

            }
            Writer.active = this;
        },
        getOffset: function () {
            var offset = parent.getChildOffset(this);
            return [offset[0] + row - 1, offset[1] + col - 1];
        },
        getHeight: function () {
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
