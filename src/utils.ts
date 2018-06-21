var fs = require('fs');
var vm = require('vm');
var path = require('path');
var util = require('util');
import ErrorWrapper from './errorWrapper';

export function sourceSync (filename, context) {
    if (!fs.existsSync(filename)) {
        return new ErrorWrapper('No such file: ' + filename);
    }
    var contents = fs.readFileSync(filename);
    return vm.runInContext(contents, context);
}

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

exports.isUndefined = exports.isUndef = function (candidate) {
    return typeof candidate === 'undefined';
};

/**
 * Returns true if candidate is an Object which is NOT a Function, RegExp, Array, Number, String, Error or Date
 */
exports.isObject = function (candidate) {
    /* According to Javascript Garden this is the one and only way to reliably do this */
    return Object.prototype.toString.call(candidate) === '[object Object]';
};

/*
 TODO need tests
 */
exports.isRegex = function (candidate) {
    return candidate instanceof RegExp;
};

exports.isNumber = function (candidate) {
    return !isNaN(candidate);
};

exports.getUserHome = function getUserHome () {
    var prop = (process.platform === 'win32') ? 'USERPROFILE' : 'HOME';
    return process.env[prop];
};

export function expandHomeDir (dir) {
    if (this.isString(dir)) {
        if (dir === '~') {
            return this.getUserHome();
        } else if (dir.indexOf('~' + path.sep) === 0) {
            return this.getUserHome() + path.sep + dir.substring(2);
        }
    }
    return dir;
}

exports.extend = util._extend;

/**
 * Array concatenating function which can handle a function arguments object. Concatenates passed arrays. Always returns
 * an array. If no arguments are given, returns an empty array. Can also be used to convert an arguments object to array
 * by passing a single argument.
 */
// TODO TESTS
exports.cat = function () {
    var result = [];
    for (var i = 0; i < arguments.length; i++) {
        result = result.concat(Array.prototype.slice.call(arguments[i], 0));
    }
    return result;
};

exports.createEnum = function () {
    var args = exports.cat(arguments);
    var enum_ = {};
    args.forEach(function (arg) {
        enum_[arg] = {
            id: arg,
            toString: function () {
                return '#' + arg.replace(/\s/g, '_');
            }
        }
    });
    return enum_;
};

exports.strToObj = function (str) {
    var props = str.split('');
    return props.reduce(function (obj, prop) { /* show off */
        obj[prop] = prop;
        return obj;
    }, {});
};
