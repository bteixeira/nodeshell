module.exports = function (panel, stdout) {
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
            return 0;
        },
        redrawBelowChild: function () {
        },
        getHeight: function () {
            return panel.getHeight();
        },
        isFooter: function () {
            return true;
        },
        rewrite: function () {
            panel.rewrite();
        },
        setFooter: function (footer_) {
            panel.setFooter(footer_);
        }
    };
    panel.setParent(me);
    panel.setFooter(me);
    return me;
};