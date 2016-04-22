var rl = require('readline');

module.exports = function (panel, stdout, footer) {
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
            if (footer) {
                return footer.getHeight();
            } else {
                return 0;
            }
        },
        getHeight: function () {
            return panel.getHeight();
        },
        isFooter: function () {
            return false;
        },
        reserveSpace: function () {
            var totalHeight = this.getHeight() + this.getSpaceBelowChild(null);
            stdout.write(new Array(totalHeight).join('\n'));
            rl.moveCursor(stdout, 0, -totalHeight + 1);
        },
        redrawBelowChild: function (child) {
            if (footer) {
                footer.rewrite();
            }
        },
        rewrite: function () {
            panel.rewrite();
        },
        setFooter: function (footer_) {
            panel.setFooter(footer_);
        }
    };
    panel.setParent(me);
    panel.setFooter(footer);
    return me;
};