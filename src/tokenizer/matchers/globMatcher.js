var TapeStateMachine = require('../../parser/tapeStateMachine');
var util = require('util');
var path = require('path');
var utils = require('../../utils');

var ESCAPABLES = {
    '0': '\0',
    'n': '\n',
    'r': '\r',
    'v': '\v',
    't': '\t',
    'b': '\b',
    'f': '\f'
};

var BREAKERS = utils.strToObj('&|<>("');

var SPECIALS = utils.createEnum('*', '?', path.sep);

var subTypes = utils.createEnum('TEXT', 'STAR', 'QUESTION', 'SEPARATOR');

function matchText(tape) {
    tape.pushMark();
    tape.setMark();

    var c = tape.peek();

    while (!(c in BREAKERS) && !(c in SPECIALS) && c !== '\\' && tape.hasMore()) {
        tape.next();
        c = tape.peek();
    }

    var text = tape.getMarked();
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

exports.run = function (tape) {

    tape.pushMark();
    tape.setMark();

    var c = tape.peek();
    if (!tape.hasMore() || c in BREAKERS || /\s/.test(c)) {
        return {
            type: t.NO_GLOB,
            pos: tape.popMark(),
            text: c
        };
    }

    var subTokens = [];
    var subToken;
    do {
        if (c in BREAKERS) {
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

    var text = tape.getMarked();
    tape.popMark();
    return {
        type: t.GLOB,
        pos: tape.mark,
        text: text,
        subTokens: subTokens
    }
};

var GlobMatcher = module.exports = function (tape) {
    TapeStateMachine.call(this, tape);
    tape.setMark();
    this.state = st.START;


    this.on(st.START, /\s/, function () {
        tape.setMark();
    });
    this.on(st.START, '\\', function () {
        this.state = st.ESCAPING;
        this.tape.pushMark();
        this.tape.setMark();
    });
    this.on(st.START, this.ANY, function (ch) {

        if (ch in BREAKERS) {
            this.token = {
                type: t.NO_GLOB,
                text: tape.getMarked()
            };
            this.stop();
        } else {
            this.state = st.INSIDE;
            this.tape.pushMark();
            if (ch in SPECIALS) {
                this.tape.setMark();
                if (ch === '*') {
                    subTokens.push({
                        type: subTypes.STAR,
                        text: ch
                    });
                } else if (ch === '?') {
                    subTokens.push({
                        type: subTypes.QUESTION,
                        text: ch
                    });
                } else if (ch === path.sep) {
                    subTokens.push({
                        type: subTypes.SEPARATOR,
                        text: ch
                    });
                }
            }
        }
    });


    var subTokens = [];
    var subTypes = utils.createEnum('TEXT', 'STAR', 'QUESTION', 'SEPARATOR');
    var chars = [];
    var marked;

    // TODO LOTS OF DUPLICATION HERE

    this.on(st.INSIDE, '\\', function () {
        var tape = this.tape;
        tape.prev();
        chars.push(tape.getMarked());
        tape.next();
        tape.setMark();
        this.state = st.ESCAPING;
    });
    this.on(st.INSIDE, this.ANY, function (ch) {
        var tape = this.tape;
        if (ch in BREAKERS || /\s/.test(ch) || ch === this.EOF) {
            if (ch !== this.EOF) {
                tape.prev();
            }
            marked = tape.getMarked();
            if (marked.length) {
                chars.push(marked);
            }
            if (chars.length) {
                subTokens.push({
                    type: subTypes.TEXT,
                    text: chars.join('')
                });
            }
            tape.popMark();
            this.token = {
                type: t.GLOB,
                text: tape.getMarked(),
                subTokens: subTokens
            };
            this.stop();
        } else if (ch in SPECIALS) {
            tape.prev();
            marked = tape.getMarked();
            if (marked.length) {
                chars.push(marked);
            }
            if (chars.length) {
                subTokens.push({
                    type: subTypes.TEXT,
                    text: chars.join('')
                });
                chars = [];
            }
            tape.next();
            tape.setMark();
            if (ch === '*') {
                subTokens.push({
                    type: subTypes.STAR,
                    text: ch
                });
            } else if (ch === '?') {
                subTokens.push({
                    type: subTypes.QUESTION,
                    text: ch
                });
            } else if (ch === path.sep) {
                subTokens.push({
                    type: subTypes.SEPARATOR,
                    text: ch
                });
            }
        } else {
            // TODO something? nothing?
        }
    });


    this.on(st.ESCAPING, this.EOF, function () {
        var tape = this.tape;
        chars.push(tape.getMarked());
        subTokens.push({
            type: subTypes.TEXT,
            text: chars.join('')
        });
        tape.popMark();
        this.token = {
            type: t.UNTERMINATED_ESCAPE,
            text: tape.getMarked(),
            subTokens: subTokens
        };
    });
    this.on(st.ESCAPING, this.ANY, function (ch) {
        if (ch in ESCAPABLES) {
            chars.push(ESCAPABLES[ch]);
        } else {
            chars.push(ch);
        }
        // TODO YOU PROBABLY WANT UNICODES TOO (\uXXXX and \xXX)
        this.tape.setMark();
        this.state = st.INSIDE;
    });

};

util.inherits(GlobMatcher, TapeStateMachine);

var st = GlobMatcher.prototype.states = utils.createEnum('START', 'INSIDE', 'ESCAPING');

var t = GlobMatcher.prototype.tokens = utils.createEnum('GLOB', 'NO_GLOB', 'UNTERMINATED_ESCAPE');

var run_ = TapeStateMachine.prototype.run;

GlobMatcher.prototype.run = function () {
    this.stack = [];
    run_.call(this);
    return this.token;
};
