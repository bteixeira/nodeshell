var ESCAPABEABLES = ' \\*?("&|><.~'.split('').reduce(function (obj, ch) {
    obj[ch] = true;
    return obj;
}, {});

var START = 0;
var DOT = 10;
var DOTDOT = 20;
var TILDE = 30;
var SEPARATOR = 40;
var PATH_ELEMENT = 50;

var ABSOLUTE = 0;
var RELATIVE = 1;
var DOTS = 2;
var NOT_A_PATH = 99; // ...and a path ain't one?


// FFS make a utility for a state machine! I have the feeling we'll need it a lot
function FTP (pointer) {
    var state = START;
    var outcome;
    var c;
    var escaping = false;

    c = pointer.next();
    while (c) {

//        if (escaping) {
////            if (c in ESCAPABEABLES) {
////                continue; // TODO actually I think it should only be skipped on / or whitespace?
////            } else {
////                // TODO must process previous character too? or maybe not
////                    // TODO well if we ignore it the behaviour is the same as in bash which is cool. The problem is only on windows because that's the separator
////            }
//            escaping = false;
//        } else {
//            if (c === '\\') {
//                escaping = true;
//                continue;
//            }
//        }

        if (!escaping && c === '\\') {
            escaping = true;
            c = pointer.next();
            continue;
        }

        if (/^\s$/.test(c) && !escaping) { // if c is whitespace...
            if (state === DOT || state === DOTDOT) {
                outcome = DOTS;
            } else if (state === TILDE) {
                outcome = TILDE;
            }
            break;
        }

        if (state === NOT_A_PATH) { // we don't care anymore, let's just skip to the end
            continue;
        }
        if (state === START) {
            if (c === '/' && !escaping) {
                outcome = ABSOLUTE;
                state = SEPARATOR;
            } else if (c === '.' && !escaping) {
                outcome = RELATIVE;
                state = DOT;
            } else if (c === '~' && !escaping) {
                outcome = RELATIVE;
                state = TILDE;
            } else {
                outcome = RELATIVE;
                state = PATH_ELEMENT;
            }
        } else if (state === DOT) {
            if (c === '.' && !escaping) {
                state = DOTDOT;
            } else if (c === '/' && !escaping) {
                outcome = DOTS;
                state = SEPARATOR;
            } else {
                state = PATH_ELEMENT;
            }
        } else if (state === DOTDOT) {
            if (c === '/' && !escaping) {
                outcome = DOTS;
                state = SEPARATOR;
            } else {
                state = PATH_ELEMENT;
            }
        } else if (state === TILDE) {
            if (c === '/' && !escaping) {
                outcome = TILDE;
                state = SEPARATOR;
            } else {
                state = PATH_ELEMENT;
            }
        }
        else if (state === PATH_ELEMENT) {
            if (c === '/' && !escaping) {
                state = SEPARATOR;
            }
            // else stay in this state
        } else if (state = SEPARATOR) {
            if (c === '.' && !escaping) {
                state = DOT;
            } else if (c === '/' && !escaping) {
                state = NOT_A_PATH;
            } else {
                state = PATH_ELEMENT;
            }
        }

        c = pointer.next();
    }

    return state;
}
