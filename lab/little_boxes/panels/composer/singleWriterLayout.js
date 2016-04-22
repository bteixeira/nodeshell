var Writer = require('../writer');

module.exports = function (stdout) {

    var writer = new Writer(stdout);

    var me = {
        reserveSpace: function () {
            // nothing?
            // move cursor to beginning and clear screen?
        },
        insert: function (ch, skipChecks) {
            writer.insert(ch, skipChecks);
        },
        getSpaceBelowChild: function (child) {
            return 0;
        },
        getChildOffsetH: function (child) {
            return 0;
        },
        redrawBelowChild: function (child) {
        },
        getChildWidth: function (child) {
            return stdout.columns;
        },
        getChildOffset: function (child) {
            return [0, 0];
        },
        isFooter: function () {
            return false;
        }
    };

    writer.setParent(me);
    return me;

};
