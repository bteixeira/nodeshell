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
        getChildWidth: function (child) {
            return stdout.columns;
        },
        getChildHeight: function (child) {
            return panel.getMinHeight();
        },
        getSpaceBelowChild: function (child) {
            return 0;
        },
        getMinHeight: function () {
            return panel.getMinHeight();
        },
        isFooter: function () {
            return true;
        },
        drawBelowChild: function () {
        },
        rewrite: function () {
            panel.rewrite();
        }
    };
    panel.setParent(me);
    return me;
};