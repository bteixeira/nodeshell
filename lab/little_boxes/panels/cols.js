var rl = require('readline');
var Writer = require('./writer');

/**
 *
 * @param children
 *      array with the children panels
 * @param layout
 *      array with width specifications. This array must have the same length as `children`. All but one of the
 *      elements must be a number, indicating the width of the respective panel in columns. The remaining element must
 *      be the string 'auto'. The 'auto' child will take the remaining width available to this panel.
 * @param stdout
 */
module.exports = function (children, layout, stdout) {

    var parent;

    var me = {
        getChildOffsetV: function (child) {
            return parent.getChildOffsetV(this);
        },
        getChildOffsetH: function (child) {
            var lt;
            var sum = 0; // the sum of all widths of all children except the `auto`
            var sumBefore; // the sum of the widths to the left of the child we're calculating
            var autoFound = false; // whether the 'auto' child was found yet
            var childFound = false; // whether the child we're calculating has been found yet
            for (var i = 0; i < children.length; i++) {
                lt = layout[i];
                if (child === children[i]) {
                    if (!autoFound) {
                        return sum + parent.getChildOffsetH(this); // if we found the child and there's no `auto` to its left, then we already know the offset
                    }
                    // otherwise, the `auto` child has been found before and we must iterate to the end to know how wide it is
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
            var autoWidth = parent.getChildWidth(this) - sum;
            sumBefore += autoWidth;
            return parent.getChildOffsetH(this) + sumBefore;
        },
        getChildOffset: function (child) {
            return [this.getChildOffsetV(child), this.getChildOffsetH(child)];
        },
        getChildWidth: function (child) {
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
            return parent.getChildWidth(this) - sum;
        },
        getSpaceBelowChild: function (child) {
            return parent.getSpaceBelowChild(this);
        },
        getHeight: function () {
            var max = 0;
            children.forEach(function (child) {
                if (child.getHeight() > max) {
                    max = child.getHeight();
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
        redrawBelowChild: function (child) {
            var me = this;
            var height = this.getHeight();

            // Since this call was triggered by a child that added a new line, we need to clear the last line of each sibling.
            children.forEach(function (ch) {
                if (ch !== child && ch.getHeight() < height) {
                    var offsetThis = me.getChildOffset(ch);
                    var offsetThat = Writer.active.getOffset();
                    var delta = [
                        offsetThis[0] - offsetThat[0],
                        offsetThis[1] - offsetThat[1]
                    ];

                    // We actually want to jump to the last line, not the first
                    delta[0] += height - 1;

                    // Jump from active panel (which might not be a child of this) to the child that needs updating
                    rl.moveCursor(stdout, delta[1], delta[0]);

                    // Write full line of spaces according to child's width
                    var childWidth = me.getChildWidth(ch);
                    stdout.write(new Array(childWidth + 1).join(' '));

                    delta[1] += childWidth;
                    // If this panel is on the right edge of the screen, the cursor is actually one character behind
                    if (me.getChildOffsetH(ch) + childWidth === stdout.columns) {
                        delta[1] -= 1;
                    }

                    // Jump back to active
                    rl.moveCursor(stdout, -delta[1], -delta[0]);
                }
            });
            parent.redrawBelowChild(this);
        },
        rewrite: function () {
            children.forEach(function (child) {
                child.rewrite();
            });
        },
        setFooter: function (footer_) {
            children.forEach(function (child) {
                child.setFooter(footer_);
            });
        }
    };
    children.forEach(function (child) {
        child.setParent(me);
    });
    return me;
};