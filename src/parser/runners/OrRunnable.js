var Or = module.exports = function (left, right) {
    this._left = left;
    this._right = right;
};

var p = Or.prototype;

p.run = function () {
    this._left.run(function (status) {
        if (status !== 0) {
            this._right.run(callback);
        } else {
            callback(status);
        }
    })
};
