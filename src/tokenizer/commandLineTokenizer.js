var util = require('util');

var Tape = require('../tape');

var jSMatcher = require('./matchers/jsMatcher');
var redirMatcher = require('./matchers/redirMatcher');
var dQStringMatcher = require('./matchers/dqStringMatcher');
var chainMatcher = require('./matchers/chainMatcher');
var GlobMatcher = require('./matchers/globMatcher');

module.exports = function (line) {
    var tape = new Tape(line.toString());

    var matcher, c, tokens = [];
    var token;

    while (tape.hasMore()) {
        c = tape.peek();
        if (/^\s$/.test(c)) {
            tape.next();
            continue;
        } else if (c === '"') {
            token = dQStringMatcher.run(tape);
            tokens.push(token);
            continue;
        } else if (c === '(') {
            token = jSMatcher.run(tape);
            tokens.push(token);
            continue;
        } else if (c === '|' || c === '&') {
            token = chainMatcher.run(tape);
            tokens.push(token);
            continue;
        } else if (c === '>' || c === '<' || /^\d$/.test(c)) {
            tape.setMark();
            tape.pushMark();
            token = redirMatcher.run(tape);
            if (token.type === redirMatcher.tokens.NOTREDIR) {
                tape.popMark();
                tape.rewindToMark();
                matcher = new GlobMatcher(tape);
            } else {
                // the mark is in the stack, forever...
                tokens.push(token);
                continue;
            }
        } else {
            matcher = new GlobMatcher(tape);
        }
        token = matcher.run();
//        console.log('got a token ' + t.type + ': ' + t.text);
        tokens.push(token);
    }

    return tokens;
};
