var vm = require('vm');
var Visitor = require(__dirname + '/visitor');

var VisitorExecuter = function (commandSet, context) {
    this.commandSet = commandSet;
    this.context = context;
};

VisitorExecuter.prototype = new Visitor();

VisitorExecuter.prototype.visitJS = function (token, callback) {
    var fun = new Function (token.code);
    result = vm.runInNewContext(token.code, this.context);
    callback(result);
};

VisitorExecuter.prototype.visitCMD = function (token, callback) {
    var me = this;
    var argValues = [];
    token.args.forEach(function (arg) {
        me.visit(arg, function (result) {
            argValues.push(result); // FIXME This is not very generic, right now I know that all calls other than CMD are sync
        })
    });
    this.commandSet.runCmd(token.name, argValues, callback);
};

VisitorExecuter.prototype.visitLiteral = function (token, callback) {
    callback(token.text);
};

VisitorExecuter.prototype.visitERR = function (token) {
    throw 'ERROR: ' + token.msg + ', at column ' + token.pos + ' "' + token.char + '"';
};

module.exports = VisitorExecuter;
