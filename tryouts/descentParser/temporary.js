var util = require('util');

var t = {};

function addAll (matcherType) {
    var matcher = require('../cascadingTokenizers/matchers/' + matcherType);
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

var ast = require('./ast');

var clt = require('../cascadingTokenizers/commandLineTokenizer');

var tape = {
    next: function () {
        var c;
        if (!this.hasMore()) {
            c = {
               type: 'EOF'
            };
        } else {
            c = this.tokens[this.pos];
        }
        console.log('>getting token ' + c.type.id + ':' + c.text + '...');
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

var printer = new (require('./printerVisitor'))();

process.stdin.on('data', function (line) {

    tape.tokens = clt(line);
    tape.pos = 0;

    var ast = COMMAND_LINE();
    printer.visit(ast);


});

function ERROR () {
    return {
        type: ERROR,
        err: true,
        pos: tape.pos,
        token: tape.tokens[tape.pos]
    };
}

/******************* TODO TODO TODO MUST CONSIDER EOF WHEN CALLING tape.next() ********************/

function REDIRECTION () {

    var first = tape.next();

    var allowed = [t.GT, t.GTGT, t.GTAMP, t.LG, t.LTGT, t.LTAMP];
    if (
        allowed.indexOf(first) === -1
        ) {
        tape.prev();
        return ERROR.apply(null, allowed);
    }

    if (!tape.hasMore()) {
        tape.prev();
        return ERROR(t.GLOB);
    }

    var second = tape.next();
    if (second.type !== t.GLOB) {
        tape.prev();
        tape.prev();
        return ERROR(t.GLOB);
    }

    return ast.REDIR(first, second);

}

function SIMPLE_COMMAND () {

    var redirs = [];
    var cmd;
    var args = [];

    var current;
    do {
        current = REDIRECTION();
        current.err || redirs.push(current);
    } while (!current.err);

    cmd = tape.next();
    if (cmd.type !== t.GLOB) {
        // TODO REWIND ENOUGH TOKENS (use redirs.length)
        return ERROR();
    }

    while (true) {
        current = tape.next();
        if (current.type === t.GLOB) {
            args.push(ast.GLOB(current));
        } else if (current.type === t.JS) {
            args.push(ast.JS(current));
        } else if (current.type === t.DQSTRING) {
            args.push(ast.DQSTRING(current));
        } else {
            tape.prev();
            current = REDIRECTION();
            if (current.err) {
                break;
            } else {
                redirs.push(current);
            }
        }
    }

    return ast.COMMAND(cmd, args, redirs);
}

function PIPELINE () {

    var simple = SIMPLE_COMMAND();

    if (simple.err) {
        return simple;
    }

    var next = tape.next();
    if (next.type === t.PIPE) {
        next = PIPELINE();
        if (next.err) {
            // no need to rewind more, recursed call should have rewinded
            tape.prev();
        } else {
            return ast.PIPELINE(simple, next);
        }
    } else {
        tape.prev();
    }
    return simple;
}

function AND_LIST () {
    var pipeline = PIPELINE();
    if (pipeline.err) {
        return pipeline;
    }

    var next = tape.next();
    if (next.type === t.DAMP) {
        next = LIST();
        if (next.err) {
            // no need to rewind more, recursed call should have rewinded
            tape.prev();
        } else {
            return ast.AND_LIST(pipeline, next);
        }
    } else {
        tape.prev();
    }
    return pipeline;
}


function OR_LIST () {
    var pipeline = PIPELINE();
    if (pipeline.err) {
        return pipeline;
    }

    var next = tape.next();
    if (next.type === t.DPIPE) {
        next = LIST();
        if (next.err) {
            // no need to rewind more, recursed call should have rewinded
            tape.prev();
        } else {
            return ast.OR_LIST(pipeline, next);
        }
    } else {
        tape.prev();
    }
    return pipeline;
}


function LIST () {
    var list = AND_LIST();
    if (list.err) {
        list = OR_LIST();
    }
    return list; // even if there was an error, return it
}


function SUBSHELL () {
    var list = LIST();
    if (list.err) {
        return list;
    }
    var next = tape.next();
    if (next.type === t.AMP) {
        next = SUBSHELL();
        if (next.err) {
            return ast.SEQUENCE(list);
        } else {
            return ast.SEQUENCE(list, next);
        }
    } else {
        tape.prev();
        return list;
    }
}

function COMMAND_LINE () {
    var subs = SUBSHELL();
    if (subs.err) {
        return subs;
    }
    if (tape.hasMore()) {
        return ERROR('EOF');
    }
    return subs;
}
