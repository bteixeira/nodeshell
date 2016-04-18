module.exports = function (panel, stdout) {
    var me = {
        getChildOffset: function (child) {
            return [this.getChildOffsetV(child), this.getChildOffsetH(child)];
        },
        getChildOffsetH: function (child) {
            return 0;
        },
        getChildOffsetV: function (child) {
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