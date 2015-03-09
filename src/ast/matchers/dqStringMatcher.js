var util = require('util');
var utils = require('../../utils');

exports.run = function (tape) {
    if (tape.peek() !== '"') {
        return t.NO_DQ_STRING;
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

    var str = tape.getMarked();
    var pos = tape.popMark();
    return {
        type: type,
        text: str,
        pos: pos
    };

};

var t = exports.tokens = utils.createEnum('DQSTRING', 'NO_DQSTRING', 'UNTERMINATED_DQSTRING', 'UNTERMINATED_ESCAPING_DQSTRING');
