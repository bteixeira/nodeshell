var util = require('util');
var ErrorWrapper = require('../errorWrapper');
var Tape = require('../tape');
var dQStringMatcher = require('../tokenizer/matchers/dqStringMatcher');
var jsMatcher = require('../tokenizer/matchers/jsMatcher');
var chainMatcher = require('../tokenizer/matchers/chainMatcher');
var redirMatcher = require('../tokenizer/matchers/redirMatcher');

var Parser = module.exports = function (commands) {
    this.commands = commands;
};

var p = Parser.prototype;

var t = {};

function addAll (matcherType) {
    var matcher = require('../tokenizer/matchers/' + matcherType);
    var p, tk = matcher.prototype.tokens;
    for (p in tk) {
        if (tk.hasOwnProperty(p)) {
            t[p] = tk[p];
        }
    }
}
addAll('globMatcher');
addAll('pathMatcher');

var ast = require('../ast/nodes/descentParserNodes');

var clt = require('./../tokenizer/commandLineTokenizer');

p.parseCmdLine = function (line) {
    this.tape = new Tape(clt(line));
    this.firstCommand = true;
    var ret = this.COMMAND_LINE();
    if (this.firstCommand && ret.err) {
        ret.firstCommand = true;
    }
    return ret;
};

p.parseJS = function (line) {
    return ast.JS({text: line, js: line});
};

p.ERROR = function () {
    return {
        type: 'ERROR',
        err: true,
        pos: this.tape.pos,
        token: this.tape.peek()
    };
};

/******************* TODO TODO TODO MUST CONSIDER EOF WHEN CALLING tape.next() ********************/

p.REDIRECTION = function () {

    var first = this.tape.next(); // contains direction and possibly fd

    var allowed = redirMatcher.tokens;//[t.GT, t.GTGT, t.GTAMP, t.LG, t.LTGT, t.LTAMP];
    if (!(first.type.id in allowed)) {
        this.tape.prev();
        return this.ERROR(allowed);
    }

    if (!this.tape.hasMore()) {
        this.tape.prev();
        return this.ERROR(t.GLOB);
    }

    var second = this.tape.next(); // target
    if (second.type !== t.GLOB) {
        this.tape.prev();
        this.tape.prev();
        return this.ERROR(t.GLOB);
    }

    if (first.type === t.GTAMP || first.type === t.LTAMP) {
        if (isNaN(Number(second.text))) {
            return this.ERROR();
        }
    }

    return ast.REDIR(first, second);

};

p.SIMPLE_COMMAND = function () {

    var redirs = [];
    var cmd;
    var args = [];

    var current;
    do {
        current = this.REDIRECTION();
        current.err || redirs.push(current);
    } while (!current.err);

    cmd = this.tape.next();
    if (cmd.type !== t.GLOB || !this.commands.isCmd(cmd.text)) {
        // TODO REWIND ENOUGH TOKENS (use redirs.length)
        return new ErrorWrapper('Unknown command: \'' + cmd.text + '\'');
    }

    while (this.tape.hasMore()) {
        current = this.tape.next();
        if (current.type === t.GLOB) {
            args.push(ast.GLOB(current));
        } else if (current.type === jsMatcher.tokens.JSTOKEN) {
            args.push(ast.JS(current));
        } else if (current.type === dQStringMatcher.tokens.DQSTRING) {
            args.push(ast.DQSTRING(current));
        } else {
            this.tape.prev();
            current = this.REDIRECTION();
            if (current.err) {
                break;
            } else {
                redirs.push(current);
            }
        }
    }
    this.firstCommand = false;
    return ast.COMMAND(cmd.text, args, redirs);
};

p.PIPELINE = function () {

    var simple = this.SIMPLE_COMMAND();

    if (simple.err || !this.tape.hasMore()) {
        return simple;
    }

    var next = this.tape.next();
    if (next.type === chainMatcher.tokens.PIPE) {
        next = this.PIPELINE();
        if (next.err) {
            // no need to rewind more, recursed call should have rewinded
            this.tape.prev();
            return next; // TODO return something else which wraps `next`
        } else {
            return ast.PIPELINE(simple, next);
        }
    } else {
        this.tape.prev();
    }
    return simple;
};

p.LIST = function () {
    var pipeline = this.PIPELINE();
    if (pipeline.err || !this.tape.hasMore()) {
        return pipeline;
    }

    var next = this.tape.next();
    if (next.type === chainMatcher.tokens.DPIPE || next.type === chainMatcher.tokens.DAMP) {
        var listType = next.type;
        next = this.LIST();
        if (next.err) {
            // no need to rewind more, recursed call should have rewinded
            this.tape.prev();
        } else {
            if (listType === chainMatcher.tokens.DPIPE) {
                return ast.OR_LIST(pipeline, next);
            } else {
                return ast.AND_LIST(pipeline, next);
            }
        }
    } else {
        this.tape.prev();
    }
    return pipeline;
};

/**
 * LIST
 *
 * LIST AMP
 *
 * LIST AMP SUBSHELL
 */
p.SUBSHELL = function () {
    var list = this.LIST();
    if (list.err || !this.tape.hasMore()) {
        return list;
    }
    var next = this.tape.next();
    if (next.type === chainMatcher.tokens.AMP) {
        next = this.SUBSHELL();
        if (next.err) {
            return ast.SEQUENCE(list);
        } else {
            return ast.SEQUENCE(list, next);
        }
    } else {
        this.tape.prev();
        return list;
    }
};

/**
 * SUBSHELL EOF
 */
p.COMMAND_LINE = function () {
    var subs = this.SUBSHELL();
    if (subs.err) {
        return subs;
    }
    if (this.tape.hasMore()) {
        return this.ERROR('EOF');
    }
    return subs;
};
