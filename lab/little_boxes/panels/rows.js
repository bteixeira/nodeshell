module.exports = function (children) {

    var parent;

    var me = {
        getChildOffsetV: function (child) {
            var i;
            var sum = 0;
            for (i = 0; children[i] !== child && i < children.length; i++) {
                sum += children[i].getHeight();
            }
            return sum + parent.getChildOffsetV(this);
        },
        getChildOffsetH: function (child) {
            return parent.getChildOffsetH(this);
        },
        getChildOffset: function (child) {
            return [this.getChildOffsetV(child), this.getChildOffsetH(child)];
        },
        getChildWidth: function (child) {
            return parent.getChildWidth(this);
        },
        getSpaceBelowChild: function (child) {
            var i;
            // Find the index of the child
            for (i = 1; children[i - 1] !== child && i < children.length; i++) {
            }
            var sum = 0;
            // Sum all the heights below the child
            for (; i < children.length; i++) {
                sum += children[i].getHeight();
            }
            sum += parent.getSpaceBelowChild(this);
            return sum;
        },
        getHeight: function () {
            var sum = 0;
            children.forEach(function (child) {
                sum += child.getHeight();
            });
            return sum;
        },
        setParent: function (parent_) {
            parent = parent_;
        },
        isFooter: function () {
            return parent.isFooter();
        },
        redrawBelowChild: function (child) {
            var found = false;
            children.forEach(function (ch) {
                if (found) {
                    ch.rewrite();
                }
                if (child === ch) {
                    found = true;
                }
            });
            parent.redrawBelowChild(this);
        },
        rewrite: function () {
            children.forEach(function (child) {
                child.rewrite();
            });
        }
    };

    children.forEach(function (child) {
        child.setParent(me);
    });
    return me;
};