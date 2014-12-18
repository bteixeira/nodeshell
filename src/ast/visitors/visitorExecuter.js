var vm = require('vm');
var path = require('path');

var utils = require('../../utils');
var Visitor = require('./visitor');
var ErrorWrapper = require('../../errorWrapper');

var VisitorExecuter = function (commandSet, context) {
    this.commandSet = commandSet;
    this.context = context;
};

VisitorExecuter.prototype = new Visitor();

VisitorExecuter.prototype.visitJS = function (token, callback) {
    var result;
    try {
        new Function (token.code);
        result = vm.runInContext(token.code, this.context);
    } catch (ex) {
        result = new ErrorWrapper(ex);
    }
    callback(result);
};

VisitorExecuter.prototype.visitCMD = function (token, callback) {
    var me = this;
    var argValues = [];
    var error;
    token.args.forEach(function (arg) {
        if (error) {
            return;
        }
        me.visit(arg, function (result) {
            if (result instanceof ErrorWrapper) {
                error = result;
                return;
            }
            argValues.push(result); // FIXME This is not very generic, right now it works because I know that all calls other than CMD are sync
        });
    });
    if (error) {
        callback(error);
    } else {
        this.commandSet.runCmd(token.name, argValues, callback);
    }
};

VisitorExecuter.prototype.visitLiteral = function (token, callback) {
    var text = token.text.trim();
    text = utils.expandHomeDir(text);
    callback(text);
};

VisitorExecuter.prototype.visitERR = function (token, callback) {
    callback(new ErrorWrapper(token));
};

module.exports = VisitorExecuter;
