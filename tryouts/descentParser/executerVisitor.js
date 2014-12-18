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

p.visitREDIR = function (redir) {
    // TODO HANDLE DIRECTLY IN COMMAND?
};

p.visitCOMMAND = function (token /*, callback*/) {

//    return an object that
//        has a set of [fd->stream] mappings which will be applied when running
//        has a run method which will start whatever, with said redirections
//        has a method to map fd->stream (can not existing fd's may not be remapped after starting)
//        has the same, or a different method, to clear redirections (can call with null)
//        has a method to provide access to all open streams, after it started

// OR

// take an stdio argument which takes precedence over any config of this node
// start command with computed redirects based on REDIR children and stdio argument
// return object of open streams
    // THIS DOESN'T WORK BECAUSE PARENT ALSO NEEDS TO KNOW RETURN STATUS/RESULT FROM CHILD
        // DOES IT? WHAT IF WE USE CALLBACKS FOR THAT?
};

p.visitPIPELINE = function (pipeline, stdio) {
//    var left = this.visit(pipeline.left, [stdio[0], null, stdio[2]]);
//    var right = this.visit(pipeline.right, [null, stdio[1], stdio[2]]);
//    left.stdio[1].pipe(right.stdio[0]);

    var left = this.visit(pipeline.left);
    var right = this.visit(pipeline.right);

    left.clear()

    function run () {

    }
};

p.visitAND_LIST = function (list) {

};

p.visitOR_LIST = function (list) {

};

p.visitSEQUENCE = function (sequence) {
    // run first in background (inherit stdio), empty callback
    // run second with
};

p.visitGLOB = function (glob) {
    // TODO CHECK IF IT REALLY IS GLOB, IF SO RETURN ARRAY OF MATCHED FILENAMES, ELSE RETURN ARRAY WITH LITERAL AS ONLY ELEMENT
};

p.visitJS = function (js) {
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

var oldVisit = p.visit;

p.visit = function (node, stdio) {
    stdio = stdio || [process.stdin, process.stdout, process.stderr];
    oldVisit.call(this, node, stdio);
};

module.exports = ExecuterVisitor;