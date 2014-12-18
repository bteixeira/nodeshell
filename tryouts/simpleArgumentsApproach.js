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

// take an stdio argument which takes precedence over any config of this node
// start command with computed redirects based on REDIR children and stdio argument
// return object of open streams
    // THIS DOESN'T WORK BECAUSE PARENT ALSO NEEDS TO KNOW RETURN STATUS/RESULT FROM CHILD
    // DOES IT? WHAT IF WE USE CALLBACKS FOR THAT?


};

p.visitPIPELINE = function (pipeline, callback, stdio) {
    var left = this.visit(pipeline.left, [stdio[0], null, stdio[2]], noop);
    var right = this.visit(pipeline.right, [null, stdio[1], stdio[2]], callback);

    left[1].pipe(right[0]);

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
