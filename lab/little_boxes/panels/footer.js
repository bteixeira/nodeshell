module.exports = function (panel, stdout) {
    //var panel;
    var me = {
        getOffset: function (child) {
            return [this.getOffsetV(child), this.getOffsetH(child)];
        },
        getOffsetH: function (child) {
            return 0;
        },
        getOffsetV: function (child) {
            //throw('I DONT KNOW HOW TO SOLVE THIS YET');
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