var tape = new Tape(); // token stream
var t = {};
var ast = {};


/******************* TODO TODO TODO MUST CONSIDER EOF WHEN CALLING tape.next() ********************/

function REDIRECTION () {

    var first = tape.next();
    var second;
    var ret;

    if (first.type === t.GT) {
        second = PATH();
        ret = ast.GT;
    } else if (first.type === t.GTGT) {
        second = PATH();
        ret = ast.GTGT;
    } else if (first.type === t.GTAMP) {
        second = FD();
        ret = ast.GTAMP;
    } else if (first.type === t.LT) {
        second = PATH();
        ret = ast.LT;
    } else if (first.type === t.LTGT) {
        second = PATH();
        ret = ast.LTGT;
    } else if (first.type === t.LTAMP) {
        second = FD();
        ret = ast.LTAMP;
    } else {
        tape.prev();
        return ERROR();
    }

    if (second.err) {
        return second;
    } else {
        return ret(second);
    }

}



function PATH () {

    var first = tape.next();

    if (first === t.RELATIVE_PATH) {
        return ast.RELATIVE_PATH(first);
    } else if (first === t.ABSOLUTE_PATH) {
        return ast.ABSOLUTE_PATH(first);
    } else if (first === t.DOTS_PATH) {
        return ast.DOTS_PATH(first);
    } else if (first === t.TILDE_PATH) {
        return ast.TILDE_PATH(first);
    } else {
        tape.prev();
        return ERROR();
    }
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

    cmd = PATH();
    if (cmd.err) {
        // TODO REWIND ENOUGH TOKENS (use redirs.length)
        return cmd;
    }

    while (true) {
        current = tape.next();
        if (current.type === t.GLOB) {
            args.push(ast.ARG(current));
        } else if (current.type === t.JS) {
            args.push(ast.ARG(current));
        } else if (current.type === t.DQSTRING) {
            args.push(ast.ARG(current));
        } else {
            tape.prev();
            current = REDIRECTION();
            if (current.err) {
                current = PATH();
                if (current.err) {
                    break;
                } else {
                    args.push(ast.ARG(current));
                }
            } else {
                redirs.push(curent);
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
    return ast.PIPELINE(simple);
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
    return ast.AND_LIST(pipeline);
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
    return ast.OR_LIST(pipeline);
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
            return ast.SEQUENCE({background: list});
        } else {
            return ast.SEQUENCE({background: list, next: next});
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
        ERROR();
    }
}
