var rl = require('readline');

module.exports = function (panel, stdout, footer) {
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