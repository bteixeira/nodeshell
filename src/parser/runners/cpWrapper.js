/* Child Process Wrapper */

var fs = require('fs');
var cp = require('child_process');
var utils = require('../../utils');

var CPW = module.exports = function (path, args) {
    this._started = false;
    this._stdio = [];
    this._path = path;
    this._args = args;
};

var p = CPW.prototype;

p._getStream = function (id) {
    if (utils.isString(id)) {
        return fs.createWriteStream(id);
    } else if (utils.isNumber(id)) {
        if (this._started) {
            return this._child.stdio[id];
        } else {
            return null;
        }
    } else {
        return id;
    }
};

p.run = function (callback) {
//    var stdio = [];
//    var i, stream;
//    for (i = 0 ; i < Math.max(this._inputs.length, this._outputs.length) ; i++) {
//        if (this._inputs[i] || this._outputs[i]) {
//            stdio[i] = 'pipe';
//        }
//    }
    var child = this._child = cp.spawn(this._path, this._args, {stdio: /*'inherit'*/ this._stdio});
    this._started = true;
//    for (i = 0 ; i < Math.max(this._inputs.length, this._outputs.length) ; i++) {
//        if (this._inputs[i]) {
//            stream = this._getStream(this._inputs[i]);
//            stream.pipe(child.stdio[i]);
//        }
//        if (this._outputs[i]) {
//            stream = this._getStream(this._outputs[i]);
//            child.stdio[i].pipe(stream);
//        }
//    }
    child.on('exit', function (status) {
        callback(status);
    });
    this.pipes = child.stdio;
};

//p.redirOutput = function (fd, to) {
//    this._outputs[fd] = to;
//    if (this._started) { // TODO CONSIDER REFUSING TO REPIPE WHEN ALREADY STARTED
//        this._child.stdio[fd].pipe(this._getStream(to)); // TODO CHECK TYPE
//    }
//};
//
//p.redirInput = function (fd, from) {
//    this._inputs[fd] = from;
//    if (this._started) {
//        this._getStream(from).pipe(this._child.stdio[fd]);
//    }
//};
//
//p.hasOutput = function (fd) {
//    return this._outputs[fd];
//};
//
//p.hasInput = function (fd) {
//    return this._inputs[fd];
//};

p.configFd = function (fd, config) {
    this._stdio[fd] = config;
};

p.hasConfig = function (fd) {
    return fd < this._stdio.length;
};