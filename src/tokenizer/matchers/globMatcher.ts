import * as path from 'path';
import * as utils from '../../utils';

const ESCAPABLES = {
    '0': '\0',
    'n': '\n',
    'r': '\r',
    'v': '\v',
    't': '\t',
    'b': '\b',
    'f': '\f'
};

const BREAKERS = utils.strToObj('&|<>("');

const SPECIALS = utils.createEnum('*', '?');

var subTypes = utils.createEnum('TEXT', 'STAR', 'QUESTION', 'SEPARATOR');

function matchText(tape) {
    tape.pushMark();
    tape.setMark();

    var c = tape.peek();

    while (!(c in BREAKERS) && !/^\s$/.test(c) && !(c in SPECIALS) && c !== '\\' && tape.hasMore() && c.type !== 'COMPLETION') {
        tape.next();
        c = tape.peek();
    }

    var text = tape.getMarked();
    if (text.join) {
        text = text.join('');
    }
    tape.popMark();
    return {
        type: subTypes.TEXT,
        text: text
    };
}

function matchSpecial (tape) {
    var c = tape.next();
    var type;
    if (c === '*') {
        type = subTypes.STAR;
    } else if (c === '?') {
        type = subTypes.QUESTION;
    }
    return {
        type: type,
        text: c
    };
}

function matchEscape (tape) {
    if (tape.next() !== '\\') {
        return {
            err: true
        };
    }

    if (!tape.hasMore()) {
        return {
            pos: tape.pos,
            type: t.UNTERMINATED_ESCAPE,
            err: true
        }
    }

    var c = tape.next();
    if (c in ESCAPABLES) {
        c = ESCAPABLES[c];
    }

    return {
        type: subTypes.TEXT,
        text: c
    };
}

export function run (tape) {

    tape.pushMark();
    tape.setMark();

    var c = tape.peek();
    if (!tape.hasMore() || c in BREAKERS || /^\s$/.test(c)) {
        return {
            type: t.NO_GLOB,
            pos: tape.popMark(),
            text: c
        };
    }

    var subTokens = [];
    var subToken, text, type;
    do {
        if (c.type === 'COMPLETION') {
            type = 'COMPLETION';
            break;
        } else if (c in BREAKERS || /\s/.test(c)) {
            break;
        } else if (c in SPECIALS) {
            subTokens.push(matchSpecial(tape));
        } else if (c === '\\') {
            subToken = matchEscape(tape);
            if (subToken.err) {
                tape.rewindToMark();
                tape.popMark();
                return subToken;
            }
            subTokens.push(subToken);
        } else if (c === path.sep) {
            tape.next();
            subTokens.push({type: subTypes.SEPARATOR, text: c});
        } else {
            subTokens.push(matchText(tape));
        }
        c = tape.peek();
    } while (tape.hasMore());

    text = tape.getMarked();
    if (text.join) {
        text = text.join('');
    }

    tape.popMark();
    return {
        type: type || t.GLOB,
        pos: tape.mark,
        text: text,
        subTokens: subTokens
    }
}

var t = exports.tokens = utils.createEnum('GLOB', 'NO_GLOB', 'UNTERMINATED_ESCAPE');
