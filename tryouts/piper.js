
var fs = require('fs');
var vm = require('vm');
var utils = require('../src/utils');

var CPW = module.exports = function (path, args) {
    this._started = false;
    this._pipes = {};
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

p.run = function () {
    var stdio = [], later = [];
    var fd, stream;
    var me = this;
    for (fd in this._pipes) {
        if (this._pipes.hasOwnProperty(fd)) {
            stream = this._getStream(this._pipes[fd]);
            if (stream) {
                stdio[fd] = stream;
            } else {
                later.push(fd);
            }
        }
    }
    this._child = vm.spawn(this._path, this._args, {stdio: stdio});
    this._started = true;
    later.forEach(function(from) {
        var to = me._pipes[from];
        var stream = me._getStream(to);
        me._child.stdio[from].pipe(stream);
    });
};

p.redirect = function (fd, where) {
    this._pipes[fd] = where;
    if (this._started) { // TODO CONSIDER REFUSING TO REPIPE WHEN ALREADY STARTED
        this._child.stdio[fd].pipe(where); // TODO CHECK TYPE
    }
};
