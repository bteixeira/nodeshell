var vm = require('vm');
var path = require('path');
var cp = require('child_process');
var spawn = cp.spawn;
var fs = require('fs');
var util = require('util');

var utils = require('../../src/utils');
var Visitor = require('../../src/ast/visitors/visitor');
var ErrorWrapper = require('../../src/errorWrapper');

var PipeRunnable = require('./runners/PipeRunnable');
var CPW = require('./runners/cpWrapper');
var AndR = require('./runners/AndRunnable');
var OrR = require('./runners/OrRunnable');
var SequenceR = require('./runners/SequenceRunnable');

var ExecuterVisitor = function (commandSet, context) {
    this.commandSet = commandSet;
    this.context = context;
};

var p = ExecuterVisitor.prototype = new Visitor();

function noop() {
}

p.visitREDIR = function (redir) {
    // HANDLED DIRECTLY IN COMMAND
};

p.toString = function () {
    return 'RunnableWrapperApproach';
};

p.visitCOMMAND = function (token) {
//    return an object that
//        has a set of [fd->stream] mappings which will be applied when running
//        has a run method which will start whatever, with said redirections
//        has a method to map fd->stream (existing fd's cannot be remapped after starting)
//        has the same, or a different method, to clear redirections (can call with null)
//        has a method to provide access to all open streams, after it started
//        UPDATE the mapping must differentiate between input redirection and output redirection
//        has a method to know, before running, if an fd is supposed to be redirected/inputted

    var args = [];
    var me = this;
    token.args.forEach(function (arg) {
        var result = me.visit(arg);
        if (arg.type === 'GLOB') {
            args = args.concat(result);
        } else if (arg.type === 'DQSTRING') {
            args.push(result);
        } else if (arg.type === 'JS') {
            result.run(function (res) {
                args.push(res);
            });
        }
    });
    var runner = this.commandSet.getCmd(token.cmd, args);
    token.redirs.forEach(function (redir) {
        var direction = redir.direction.type.id;
        var fd = redir.direction.number;
        var target = redir.target;

        if (direction === 'LT') {
            if (!utils.isNumber(fd)) {
                fd = 0;
            }
            runner.configFd(fd, fs.createReadStream(target));
        } else if (direction === 'GT') {
            if (!utils.isNumber(fd)) {
                fd = 1;
            }
            runner.configFd(fd, fd.createWriteStream(target)); // truncates
        } else if (direction === 'GTGT') {
            if (!utils.isNumber(fd)) {
                fd = 1;
            }
            runner.configFd(fd, fd.createWriteStream(target, {flags: 'a'})); // truncates
        } else if (direction === 'LTGT') {
            if (!utils.isNumber(fd)) {
                fd = 0;
            }
            runner.configFd(fd, fd.createWriteStream(target, {flags: 'a'})); // truncates
        } else if (direction === 'GTAMP') {
            // TODO THIS DOESN'T REALLY WORK RIGHT NOW, FD VALUE IS PASSED DIRECTLY TO SPAWN SO IT REFERS TO PARENT'S FD. SAME GOES FOR LTAMP
            if (!utils.isNumber(fd)) {
                fd = 1;
            }
            runner.configFd(fd, target);
        } else if (direction === 'LTAMP') {
            if (!utils.isNumber(fd)) {
                fd = 0;
            }
            runner.configFd(fd, target);
        }

        // TODO MUST DETECT DUPLICATE FDs AND OPEN DUPLEX STREAM FOR THEM (e.g., "somecommand 7>thefile 7<thefile")

    });
    return runner;
};

p.visitPIPELINE = function (pipeline) {
    var left = this.visit(pipeline.left);
    var right = this.visit(pipeline.right);
//
//    left.clearRedirect(1);
//    right.clearInput(0);
//
//    // methods that get/set mappings must check for 1 and 0, and apply it to the corresponding child. other fd's should
//    // either be ignored or applied to both children. if the latter, then keep a record of them
//
//    function run (callback) {
//        left.run(noop);
//        right.run(callback);
//        left.pipes[1].pipe(right.pipes[0]);
//
//        this.pipes = [left.pipes[0], right.pipes[1]]; // may also apply other redirections if more than 1 and 0 are allowed
//    }

    return new PipeRunnable(left, right);
};

p.visitAND_LIST = function (list) {
    var left = this.visit(list.left);
    var right = this.visit(list.right);

    return new AndR(left, right);
};

p.visitOR_LIST = function (list) {
    var left = this.visit(list.left);
    var right = this.visit(list.right);

    return new OrR(left, right);
};

p.visitSEQUENCE = function (sequence) {
    var left = this.visit(sequence.left);
    var right;
    if (sequence.right) {
        right = this.visit(sequence.right);
    }

    return new SequenceR(left, right);
};

p.visitGLOB = function (glob) {
    var subTokens = glob.glob.subTokens;

    /* If the first token is ~ then expand it to home dir if it is alone or if it is followed by a path separator */
    if (subTokens[0].text === '~' && (subTokens.length === 1 || subTokens[1].type.id === 'SEPARATOR')) {
        subTokens[0].text = utils.getUserHome();
    }

    /* First phase: transform the subtoken list into another one with literal path components and globbed path components */
    var tokenGroups = [];
    var group = [];
    var lastGroup;
    var globbing = false;
    subTokens.forEach(function (subToken, i) {
        group.push(subToken);
        if (subToken.type.id === 'SEPARATOR' || i === subTokens.length - 1) {
            lastGroup = tokenGroups[tokenGroups.length - 1];
            if (lastGroup && !globbing && !lastGroup.globbing) {
                lastGroup.group = lastGroup.group.concat(group);
            } else {
                tokenGroups.push({
                    glob: globbing,
                    group: group
                });
                globbing = false;
            }
            group = [];
        } else if (subToken.type.id === 'STAR' || subToken.type.id === 'QUESTION') {
            globbing = true;
        }
    });

    /* Second phase: build the list of matched paths evaluating one component at a time. For literals, append it to each one */
    var extracted = [''], aux;
    var join, regex, dirs;
    tokenGroups.forEach(function (tokenGroup, i) {
        if (tokenGroup.glob) {
            regex = buildRegex(tokenGroup.group);
            aux = [];
            extracted.forEach(function (extr) {
                dirs = fs.readdirSync(extr || '.');
                dirs.forEach(function (dir) {
                    if (regex.test(dir)) {
                        aux.push(extr + dir);
                    }
                });
            });
            extracted = aux;
        } else {
            join = tokenGroup.group.reduce(function (prev, token) {
                return prev + token.text;
            }, '');
            extracted = extracted.map(function (extr) {
                return extr + join;
            });
        }
    });

    function buildRegex (tokenGroup) {
        var re = '^';
        tokenGroup.forEach(function (token) {
            if (token.type.id === 'STAR') {
                re += '.*';
            } else if (token.type.id === 'QUESTION') {
                re += '.';
            } else {
                re += token.text.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            }
        });
        re += '$';
        return new RegExp(re);
    }

    return extracted;
};

p.visitJS = function (token) {
    // run js and return result
//    function run (callback) {
//        callback(exec(js));
//    }
    var me = this;
    return {
        run: function (callback) {
            var result = vm.runInContext(token.js, me.context);
            callback(result);
        },
        hasConfig: function (fd) {
            return false;
        },
        configFd: function (fd, config) {
        }
    }
};

p.visitDQSTRING = function (dqstring) {
    // TODO JUST RETURN TEXT? DO I NEED TO TAKE CARE OF ESCAPES?
    return dqstring.dqstring.string;
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

p.visitERROR = function (err) {
    return err;
};

p.visit = function (node) {
    this.visit = superVisit; // temporarily. tricky. never saw this anywhere. wonder if it really works
    var runner = this.visit(node);
    this.visit = p.visit;
    if (!runner.hasConfig(0)) {
        runner.configFd(0, process.stdin);
    }
    if (!runner.hasConfig(1)) {
        runner.configFd(1, process.stdout);
    }
    if (!runner.hasConfig(2)) {
        runner.configFd(2, process.stderr);
    }
    return runner;
};

module.exports = ExecuterVisitor;
