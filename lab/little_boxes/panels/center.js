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
            return footer.getHeight();
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
            footer.rewrite();
        },
        rewrite: function () {
            panel.rewrite();
        }
    };
    panel.setParent(me);
    return me;
};