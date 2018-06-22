import utils = require('../../utils');

export function run (tape) {
    if (tape.peek() !== '"') {
        return {
            type: t.NO_DQSTRING,
            text: tape.peek(),
            pos: tape.pos
        };
    }

    tape.pushMark();
    tape.setMark(); // TODO push is always followed by set, isn't it?

    tape.next();

    var c, type;

    while (tape.hasMore()) {
        c = tape.next();
        if (c === '"') {
            type = t.DQSTRING;
            break;
        } else if (c === '\\') {
            if (!tape.hasMore()) {
                type = t.UNTERMINATED_ESCAPING_DQSTRING;
                break;
            }
            tape.next();
        }
        if (!tape.hasMore()) {
            type = t.UNTERMINATED_DQSTRING;
        }
    }

    var text = tape.getMarked();
    var pos = tape.popMark();

    if (text.join) {
        text = text.join('');
    }

    return {
        type: type,
        text: text,
        pos: pos
    };

}

const t = exports.tokens = utils.createEnum('DQSTRING', 'NO_DQSTRING', 'UNTERMINATED_DQSTRING', 'UNTERMINATED_ESCAPING_DQSTRING');
