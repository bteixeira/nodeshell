// Matches command chainers ('|', '&', '||' or '&&')

import * as utils from '../../utils';

export function run (tape) {

    tape.pushMark();
    tape.setMark();

    var c = tape.next();
    var type;

    if (c === '&') {
        if (tape.peek() === '&') {
            tape.next();
            type = t.DAMP;
        } else {
            type = t.AMP;
        }
    } else if (c === '|') {
        if (tape.peek() === '|') {
            tape.next();
            type = t.DPIPE;
        } else {
            type = t.PIPE;
        }
    } else {
        tape.prev();
        type = t.NOT_CHAIN;
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

const t = exports.tokens = utils.createEnum('AMP', 'PIPE', 'DAMP', 'DPIPE', 'NOT_CHAIN');
