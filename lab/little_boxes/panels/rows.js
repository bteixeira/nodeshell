module.exports = function (children) {

    var parent;

    var me = {
        getChildOffset: function (child) {
            return [this.getChildOffsetV(child), this.getChildOffsetH(child)];
        },
        getChildOffsetH: function (child) {
            return parent.getChildOffsetH(this);
        },
        getChildOffsetV: function (child) {
            var i;
            var sum = 0;
            for (i = 0; children[i] !== child && i < children.length; i++) {
                sum += children[i].getMinHeight();
            }
            return sum + parent.getChildOffsetV(this);
        },
        getChildWidth: function (child) {
            return parent.getChildWidth(this);
        },
        getChildHeight: function (child) {
            return child.getMinHeight();
        },
        getSpaceBelowChild: function (child) {
            var i;
            for (i = 1; children[i - 1] !== child && i < children.length; i++) {
            }
            var sum = 0;
            for (; i < children.length; i++) {
                sum += children[i].getMinHeight();
            }
            sum += parent.getSpaceBelowChild(this);
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
        drawBelowChild: function (child) {
            var found = false;
            children.forEach(function (ch) {
                if (found) {
                    ch.rewrite();
                }
                if (child === ch) {
                    found = true;
                }
            });
            parent.drawBelowChild(this);
        },
        rewrite: function () {
            children.forEach(function (child) {
                child.rewrite();
            });
        },
        width: function () {
            return this.getChildWidth(null);
        }
    };

    children.forEach(function (child) {
        child.setParent(me);
    });
    return me;
};