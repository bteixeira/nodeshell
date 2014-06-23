var Visitor = require(__dirname + '/../visitor');

var VisitorPrinter = function () {
    this.indent = 0;
};

VisitorPrinter.prototype = new Visitor();

function print(indent, msg) {
    console.log(new Array(indent + 1).join('\t') + msg);
}

VisitorPrinter.prototype.log = function (msg) {
    print(this.indent, msg);
};

VisitorPrinter.prototype.visitJS = function (token) {
    this.log('JS FRAGMENT: ' + token.code);
};

VisitorPrinter.prototype.visitCMD = function (token) {
    this.log('CMD (' + token.args.length + ' args): ' + token.name);
    this.indent += 1;
    var me = this;
    token.args.forEach(function (arg) {
        me.visit(arg);
    });
    this.indent -= 1;
};

VisitorPrinter.prototype.visitLiteral = function (token) {
    this.log('LITERAL: ' + token.text);
};

VisitorPrinter.prototype.visitERR = function (token) {
    this.log('ERROR: ' + token.msg + ', at column ' + token.pos + ' "' + token.char + '"');
};

module.exports = VisitorPrinter;
