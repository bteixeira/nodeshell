var readline = require('readline');

module.exports = function (center, footer, stdout) {

    var me = {
        getChildOffsetV: function (child) {
            return 0;
        },
        getChildOffsetH: function (child) {
            return 0;
        },
        getChildOffset: function (child) {
            return [this.getChildOffsetV(child), this.getChildOffsetH(child)];
        },
        getChildWidth: function (child) {
            return stdout.columns;
        },
        getSpaceBelowChild: function (child) {
            if (child === center && footer) {
                return footer.getHeight();
            } else {
                return 0;
            }
        },
        isFooter: function (child) {
            return (child === footer);
        },
        reserveSpace: function () {
            var totalHeight = center.getHeight();
            if (footer) {
                totalHeight += footer.getHeight();
            }
            stdout.write(new Array(totalHeight).join('\n'));
            readline.moveCursor(stdout, 0, -totalHeight + 1);
        },
        redrawBelowChild: function (child) {
            if (child === center && footer) {
                footer.rewrite();
            }
        },
        rewrite: function () {
            center.rewrite();
            if (footer) {
                footer.rewrite();
            }
        },

        reset: function () {
            center.reset();
            if (footer) {
                footer.reset();
            }
        }
    };

    center.setParent(me);
    if (footer) {
        footer.setParent(me);
    }

    return me;

};