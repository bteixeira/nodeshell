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

//p.redirOutput = function (fd, to) {
//    this._left.redirOutput(fd, to);
//    this._right.redirOutput(fd, to);
//};
//
//p.redirInput = function (fd, from) {
//    this._left.redirInput(fd, from);
//    this._right.redirInput(fd, from);
//};
//
//p.hasOutput = function (fd) {
//    return this._left.hasOutput(fd) || this._right.hasOutput(fd);
//};
//
//p.hasInput = function (fd) {
//    return this._left.hasInput(fd) || this._right.hasInput(fd);
//};
