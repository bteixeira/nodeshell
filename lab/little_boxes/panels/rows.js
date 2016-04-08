module.exports = function (children) {

    var parent;

    var me = {
        getOffset: function (child) {
            return [this.getOffsetV(child), this.getOffsetH(child)];
        },
        getOffsetH: function (child) {
            return parent.getOffsetH(this);
        },
        getOffsetV: function (child) {
            var i;
            var sum = 0;
            for (i = 0; children[i] !== child && i < children.length; i++) {
                sum += children[i].getMinHeight();
            }
            return sum;
        },
        getWidth: function (child) {
            return parent.getWidth(this);
        },
        getHeight: function (child) {
            return child.getMinHeight();
        },
        getAfterSpace: function (child) {
            var i;
            for (i = 1; children[i - 1] !== child && i < children.length; i++) {
            }
            var sum = 0;
            for (; i < children.length; i++) {
                sum += children[i].getMinHeight();
            }
            sum += parent.getAfterSpace(this);
            return sum;
        },
        getMinHeight: function () {
            var sum = 0;
            children.forEach(function (child) {
                sum += child.getMinHeight();
            });
            return sum;
        },
        setParent: function (parent_) {
            parent = parent_;
        },
        isFooter: function () {
            return parent.isFooter();
        },
        drawBelow: function (child) {
            var found = false;
            children.forEach(function (ch) {
                if (found) {
                    ch.rewrite();
                }
                if (child === ch) {
                    found = true;
                }
            });
            parent.drawBelow(this);
        },
        rewrite: function () {
            children.forEach(function (child) {
                child.rewrite();
            });
        },
        width: function () {
            return this.getWidth(null);
        }
    };

    children.forEach(function (child) {
        child.setParent(me);
    });
    return me;
};