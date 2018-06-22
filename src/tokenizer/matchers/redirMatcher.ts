import utils = require('../../utils');

/**
 * Allowed sequences:
 *      [0-9]*>
 *      [0-9]*>>
 *      [0-9]*>&
 *      [0-9]*<
 *      [0-9]*<>
 *      [0-9]*<&
 */

export function run (tape) {
    tape.pushMark();
    tape.setMark();

    var c = tape.next();
    var type, fd;

    if (/\d/.test(c)) {
        while (/\d/.test(tape.peek())) {
            tape.next();
        }
        fd = tape.getMarked();
        c = tape.next();
    }

    if (c === '>') {
        if (tape.peek() === '>') {
            tape.next();
            type = t.GTGT;
        } else if (tape.peek() === '&') {
            tape.next();
            type = t.GTAMP;
        } else {
            type = t.GT;
        }
    } else if (c === '<') {
        if (tape.peek() === '>') {
            tape.next();
            type = t.LTGT;
        } else if (tape.peek() === '&') {
            tape.next();
            type = t.LTAMP;
        } else {
            type = t.LT;
        }
    } else {
        tape.prev();
        type = t.NOTREDIR;
    }

    var text = tape.getMarked();
    var pos = tape.popMark();

    return {
        type: type,
        text: text,
        pos: pos,
        fd: fd
    };
}

var t = utils.createEnum('NOTREDIR', 'GT', 'GTGT', 'GTAMP', 'LT', 'LTGT', 'LTAMP');

export {t as tokens}
