var path = require('path');

var utils = require('../../src/utils');
var Visitor = require('../../src/ast/visitors/visitor');

var PrinterVisitor = function () {
    this.tab = 0;
};

var p = PrinterVisitor.prototype = new Visitor();

p.print = function (msg) {
    var tabs = new Array(this.tab + 1).join('\t');
    console.log(tabs + msg);
};

p.visitREDIR = function (redir) {
    this.print('Redirection: ' + redir);
};

p.visitCOMMAND = function (command) {
    this.print('Command "' + command.cmd.text + '"');
    this.tab++;
    this.print('Arguments:');
    this.tab++;
    var me = this;
    command.args.forEach(function (arg) {
        me.visit(arg);
    });
    this.tab--;
    this.print('Redirections:' + (command.redirs.length ? '' : ' (none)'));
    this.tab++;
    command.redirs.forEach(function (redir) {
        me.visit(redir);
    });
    this.tab--;
    this.tab--;
};

p.visitPIPELINE = function (pipeline) {
    this.print('PIPELINE');
    this.tab++;
    this.visit(pipeline.left);
    if (pipeline.right) {
        this.visit(pipeline.right);
    }
    this.tab--;
};

p.visitAND_LIST = function (list) {
    this.print('AND_LIST');
    this.tab++;
    this.visit(list.left);
    if (list.right) {
        this.visit(list.right);
    }
    this.tab--;
};

p.visitOR_LIST = function (list) {
    this.print('OR_LIST');
    this.tab++;
    this.visit(list.left);
    if (list.right) {
        this.visit(list.right);
    }
    this.tab--;
};


p.visitGLOB = function (glob) {
    this.print('GLOB or PATH or FD: ' + glob.glob.text);
};
p.visitJS = function (js) {
    this.print('JAVASCRIPT code: ' + js);
};
p.visitDQSTRING = function (dqstring) {
    this.print('Literal string: ' + dqstring);
};

module.exports = PrinterVisitor;