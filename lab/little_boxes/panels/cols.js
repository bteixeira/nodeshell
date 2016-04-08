var rl = require('readline');
var Writer = require('./writer');

module.exports = function (children, layout, stdout) {

    var parent;

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
                if (ch !== child && ch.getMinHeight() < h) {
                    // CALCULATE OFFSET BETWEEN ACTIVE AND LAST ROW OF ch, USING LOGIC FROM activate() (HARDEST PART IS SWITCHES BETWEEN FOOTER AND CENTER, DOES THAT EVER HAPPEN? I THINK NOT, CONFIRM)
                    var offsetThis = me.getOffset(ch);
                    var offsetThat = Writer.active.offset();
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