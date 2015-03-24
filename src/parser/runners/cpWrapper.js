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

    var n = 0;
    var waitable = []; // file streams which have to be listened to for the 'open' event before launching the child process
    this._stdio.forEach(function (stream) {
        if (stream.constructor === fs.ReadStream || stream.constructor === fs.WriteStream) {
            waitable.push(stream);
            stream.on('open', function () {
                n++;
                verify()
            });
        }
    });

    var me = this;
    function verify() {
        if (n === waitable.length) {
            var child = me._child = cp.spawn(me._path, me._args, {stdio: /*'inherit'*/ me._stdio});
            me._started = true;
            child.on('exit', function (status) {
                callback(status);
            });
            me.pipes = child.stdio;
        }
    }

    verify();

};

p.configFd = function (fd, config) {
    this._stdio[fd] = config;
};

p.hasConfig = function (fd) {
    return (typeof this._stdio[fd]) !== 'undefined';
};