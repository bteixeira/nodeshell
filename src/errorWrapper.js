var ErrorWrapper = function (error) {
    this.error = error;
};

var p = ErrorWrapper.prototype;

p.toString = function () {
    return this.error.toString();
};

p.err = true;

module.exports = ErrorWrapper;
