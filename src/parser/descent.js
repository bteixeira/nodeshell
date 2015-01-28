var util = require('util');
var ErrorWrapper = require('../errorWrapper');

var Parser = module.exports = function (commands) {
    this.commands = commands;

    this.tape = {
        next: function () {
            var c;
            if (!this.hasMore()) {
                c = {
                    type: 'EOF'
                };
            } else {
                c = this.tokens[this.pos];
            }
//        console.log('>getting token ' + c.type.id + ':' + c.text + '...');
            this.pos = Math.min(this.pos + 1, this.tokens.length + 1);
            return c;
        },
        prev: function () {
            var c = this.tokens[this.pos];
            this.pos = Math.max(this.pos - 1, 0);
            return c;
        },
        hasMore: function () {
            return this.pos < this.tokens.length;
        }
    };
};

var p = Parser.prototype;

var t = {};

function addAll (matcherType) {
    var matcher = require('../ast/matchers/' + matcherType);
    var p, tk = matcher.prototype.tokens;
    for (p in tk) {
        if (tk.hasOwnProperty(p)) {
            t[p] = tk[p];
        }
    }
}
addAll('chainMatcher');
addAll('dqStringMatcher');
addAll('globMatcher');
addAll('jsMatcher');
addAll('pathMatcher');
addAll('redirMatcher');

var ast = require('../ast/nodes/descent');

var clt = require('./commandLineTokenizer');



p.parseCmdLine = function (line) {
    this.tape.tokens = clt(line);
    this.tape.pos = 0;
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
        token: this.tape.tokens[this.tape.pos]
    };
};

/******************* TODO TODO TODO MUST CONSIDER EOF WHEN CALLING tape.next() ********************/

p.REDIRECTION = function () {

    var first = this.tape.next(); // contains direction and possibly fd

    var allowed = [t.GT, t.GTGT, t.GTAMP, t.LG, t.LTGT, t.LTAMP];
    if (allowed.indexOf(first.type) === -1) {
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

    while (true) {
        current = this.tape.next();
        if (current.type === t.GLOB) {
            args.push(ast.GLOB(current));
        } else if (current.type === t.JSToken) {
            args.push(ast.JS(current));
        } else if (current.type === t.DQSTRING) {
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

    if (simple.err) {
        return simple;
    }

    var next = this.tape.next();
    if (next.type === t.PIPE) {
        next = this.PIPELINE();
        if (next.err) {
            // no need to rewind more, recursed call should have rewinded
            this.tape.prev();
            return next;
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
    if (pipeline.err) {
        return pipeline;
    }

    var next = this.tape.next();
    if (next.type === t.DPIPE || next.type === t.DAMP) {
        var listType = next.type;
        next = this.LIST();
        if (next.err) {
            // no need to rewind more, recursed call should have rewinded
            this.tape.prev();
        } else {
            if (listType === t.DPIPE) {
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


p.SUBSHELL = function () {
    var list = this.LIST();
    if (list.err) {
        return list;
    }
    var next = this.tape.next();
    if (next.type === t.AMP) {
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
