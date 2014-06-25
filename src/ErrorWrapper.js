var ErrorWrapper = function (error) {
    this.error = error;
};

ErrorWrapper.prototype.toString = function () {
    return this.error.toString();
};

module.exports = ErrorWrapper;
