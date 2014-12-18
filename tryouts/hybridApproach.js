var vm = require('vm');
var path = require('path');
var cp = require('child_process');
var spawn = cp.spawn;

var utils = require('../../src/utils');
var Visitor = require('../../src/ast/visitors/visitor');
var ErrorWrapper = require('../../src/errorWrapper');

var ExecuterVisitor = function (commandSet, context) {
    this.commandSet = commandSet;
    this.context = context;
};

var p = ExecuterVisitor.prototype = new Visitor();

function noop () {}

p.visitREDIR = function (redir) {
    // HANDLE DIRECTLY IN COMMAND!
};

p.visitCOMMAND = function (token, callback, stdio) {

    stdio = utils.clone(stdio);
    for (x in token.redirs) {
        if (!(x in stdio)) {
            stdio[x] = whatever;
        }
    }

    var runner = this.commands.getRunner(token.cmd);
    // actually, spawn on this side
    function run(callback) {
        runner.run(callback);
        apply(stdio);
        this.pipes = runner.stdio;
    }

};

p.visitPIPELINE = function (pipeline, callback, stdio) {
    var left = this.visit(pipeline.left, [stdio[0], null, stdio[2]], noop);
    var right = this.visit(pipeline.right, [null, stdio[1], stdio[2]], callback);

    function run (callback) {
        left.run(noop);
        right.run(callback);
        left.pipes[1].pipe(right.pipes[0]);
    }


};

p.visitAND_LIST = function (list, callback, stdio) {
    this.visit(list.left, stdio, function (status) {
        if (status === 0) {
            this.visit(list.right, stdio, callback);
        } else {
            callback(status);
        }
    });
};

p.visitOR_LIST = function (list, callback, stdio) {
    this.visit(list.left, stdio, function (status) {
        if (status !== 0) {
            this.visit(list.right, stdio, callback);
        } else {
            callback(status);
        }
    });
};

p.visitSEQUENCE = function (sequence, callback, stdio) {
    this.visit(sequence.left, stdio, noop);
    if (sequence.right) {
        this.visit(sequence.right, stdio, callback);
    } else {
        callback(0);
    }
};

p.visitGLOB = function (glob) {
    // TODO CHECK IF IT REALLY IS GLOB, IF SO RETURN ARRAY OF MATCHED FILENAMES, ELSE RETURN ARRAY WITH LITERAL AS ONLY ELEMENT
};

p.visitJS = function (js, callback) {
    // run js and return result
};

p.visitDQSTRING = function (dqstring) {
    // TODO JUST RETURN TEXT? DO I NEED TO TAKE CARE OF ESCAPES?
    return dqstring.text;
};

// OVERRIDE VISIT()
// MAKE IT TELL BETWEEN JS AND CMD
// MAKE IT TAKE A CALLBACK
// FOR JS, RUN IT AND CALLBACK WITH RESULT
// FOR CMD, VISIT FIRST NODE AND GET CHILD_PROCESS BACK
// APPLY INHERIT STDIO -> HOW TO KNOW IF THERE WAS A REDIRECTION OR NOT???
// APPEND CALLBACK TO CHILD_PROCESS

// HOW TO RUN VISIT() ONLY ONCE??? -> SOME PRE-VISIT SUPER METHOD?

var superVisit = p.visit;

p.visit = function (node, callback, stdio) {
    stdio = stdio || [process.stdin, process.stdout, process.stderr];
    superVisit.call(this, node, callback, stdio);
};

module.exports = ExecuterVisitor;
