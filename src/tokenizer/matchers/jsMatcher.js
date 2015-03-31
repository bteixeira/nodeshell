var dQStringMatcher = require('./dqStringMatcher');
var utils = require('../../utils');

exports.run = function (tape) {
    if (tape.peek() !== '(') {
        return {
            type: t.JS_ERROR,
            text: tape.peek(),
            pos: tape.pos
        };
    }

    tape.pushMark();
    tape.setMark(); // TODO PUSH MARK BEFORE CALLING MATCHER

    tape.next();

    var c, type, pos, str, stack = [];

    function top() {
        return stack[stack.length - 1];
    }

    while (tape.hasMore()) {
        c = tape.next();
        if (c === ')') {
            if (!stack.length) {
                type = t.JSTOKEN;
                break;
            } else if (top() === '(') {
                stack.pop();
            } else {
                type = t.JS_ERROR;
                pos = tape.pos - 1;
                str = c;
                break;
            }

        } else if (c === '}') {
            if (top() === '{') {
                stack.pop();
            } else {
                type = t.JS_ERROR;
                pos = tape.pos;
                break;
            }
        } else if (c === ']') {
            if (top() === '[') {
                stack.pop();
            } else {
                type = t.JS_ERROR;
                pos = tape.pos;
                break;
            }
        } else if (/[\(\[\{]/.test(c)) {
            stack.push(c);
        } else if (c === '"') {
            tape.prev();
            dQStringMatcher.run(tape);
        }
        if (!tape.hasMore()) {
            type = t.JS_ERROR;
            pos = tape.pos;
        }
    }

    str = str || tape.getMarked();
    var mark = tape.popMark();
    pos = pos || mark;
    return {
        type: type,
        text: str,
        pos: pos
    };
};

var t = exports.tokens = utils.createEnum('JS_ERROR', 'JSTOKEN');