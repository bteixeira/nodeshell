var Visitor = require(__dirname + '/visitor');

var VisitorExecuter = function (commandSet) {
    this.commandSet = commandSet;
};

VisitorExecuter.prototype = new Visitor();

VisitorPrinter.prototype.visitJS = function (token) {
    var fun = new Function (token.code);
    // TODO Run JS
};

VisitorPrinter.prototype.visitCMD = function (token) {
    var cmd = this.commandSet.getCmd(token.name);
    var argValues = [];
    token.args.forEach(function (arg) {
        argValues.push(this.visit(arg));
    });
    cmd.run(argValues); // TODO CALLBACK??
};

VisitorPrinter.prototype.visitLiteral = function (token) {
    return token.text;
};

VisitorPrinter.prototype.visitERR = function (token) {
    console.log('ERROR: ' + token.msg + ', at column ' + token.pos + ' "' + token.char + '"');
    // TODO RETURN OR CALLBACK
};

module.exports = VisitorExecuter;
