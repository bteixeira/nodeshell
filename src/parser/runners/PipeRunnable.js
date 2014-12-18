var Pipe = module.exports = function (left, right) {
    this._left = left;
    this._right = right;
};

var p = Pipe.prototype;

p.run = function (callback) {
    var left = this._left, right = this._right;
    left.configFd(1, 'pipe');
    right.configFd(0, 'pipe');
    left.run(function (){});
    right.run(callback);
    left.pipes[1].pipe(right.pipes[0]);
    this.pipes = [left.pipes[0], right.pipes[1], right.pipes[2]];
};

//p.redirOutput = function (fd, to) {
//    this._right.redirOutput(fd, to);
//};
//
//p.redirInput = function (fd, from) {
//    this._left.redirInput(fd, from);
//};
//
//p.hasOutput = function (fd) {
//    return this._right.hasOutput(fd);
//};
//
//p.hasInput = function (fd) {
//    return this._left.hasInput(fd);
//};

p.configFd = function (fd, config) {
    if (fd === 0) {
        this._left.configFd(fd, config);
    } else if (fd === 1 || fd === 2) {
        this._right.configFd(fd, config);
    }
    // else??
};

p.hasConfig = function (fd) {
    if (fd === 0) {
        return this._left.hasConfig(fd);
    } else if (fd === 1 || fd === 2) {
        return this._right.hasConfig(fd);
    }
    // else??
};
