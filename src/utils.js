var fs = require('fs');
var vm = require('vm');
var path = require('path');
var util = require('util');
var ErrorWrapper = require('./errorWrapper');

exports.sourceSync = function (filename, context) {
    if (!fs.existsSync(filename)) {
        return new ErrorWrapper('No such file: ' + filename);
    }
    var contents = fs.readFileSync(filename);
    return vm.runInContext(contents, context);
};

exports.isString = function isString (candidate) {
    return typeof candidate === 'string' || candidate instanceof String;
};

exports.isFunction = function isFunction (candidate) {
    /* Yes I know that snobs say that this check is not complete, but it seems to be, at least in node v0.10.29. All
     * functions pass this check, even if created with new Function(), and nothing else seems to be detected as a
     * function, not even regular expressions. */
    return typeof candidate === 'function';
};

exports.isArray = function (candidate) {
    return Array.isArray(candidate);
};

exports.getUserHome = function getUserHome () {
    var prop = (process.platform === 'win32') ? 'USERPROFILE' : 'HOME';
    return process.env[prop];
};

exports.expandHomeDir = function (dir) {
    if (this.isString(dir)) {
        if (dir === '~') {
            return this.getUserHome();
        } else if (dir.indexOf('~' + path.sep) === 0) {
            return this.getUserHome() + path.sep + dir.substring(2);
        }
    }
    return dir;
};

exports.extend = util._extend;

/**
 * Array concatenating function which can handle a function arguments object. Concatenates passed arrays. Always returns
 * an array. If no arguments are given, returns an empty array. Can also be used to convert an arguments object to array
 * by passing a single argument.
 */
// TODO TESTS
exports.cat = function () {
    var result = [];
    for (var i = 0 ; i < arguments.length ; i++) {
        result = result.concat(Array.prototype.call(arguments[i], 0));
    }
    return result;
};
