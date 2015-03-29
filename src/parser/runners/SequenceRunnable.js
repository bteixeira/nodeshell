var Sequence = module.exports = function (left, right) {
    this._left = left;
    this._right = right;
};

var p = Sequence.prototype;

function noop () {
}

p.run = function (callback) {
    this._left.run(noop);
    if (this._right) {
        this._right.run(callback);
    } else {
        callback(0);
    }
};

p.hasConfig = function (fd) {
    if (this._right) {
        return this._right.hasConfig(fd);
    } else {
        return fd === 0 || this._left.hasConfig(fd);
    }
};

p.configFd = function (fd, stream) {
    if (fd !== 0) {
        this._left.configFd(fd, stream);
    }
    if (this._right) {
        this._right.configFd(fd, stream);
    }
};
