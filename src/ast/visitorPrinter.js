var VisitorPrinter = function () {
    this.indent = 0;
};

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
    this.log('CMD: ' + token.name);
    this.log('(args follow)');
    this.indent += 1;
    var me = this;
    token.args.each(function (arg) {
        me.visit(arg);
    });
    this.indent -= 1;
    this.log('(args done)');
};

VisitorPrinter.prototype.visitLiteral = function (token) {
    this.log('LITERAL: ' + token.text);
};

VisitorPrinter.prototype.visit = function (token) {
    var methodName = 'visit' + token.type;
    var method = this[methodName];
    method.call(this, token);
};

module.exports = VisitorPrinter;
