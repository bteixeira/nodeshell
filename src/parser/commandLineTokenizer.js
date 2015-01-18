var util = require('util');

var Tape = require('../tape');

var JSMatcher = require('../ast/matchers/jsMatcher');
var RedirMatcher = require('../ast/matchers/redirMatcher');
var DQStringMatcher = require('../ast/matchers/dqStringMatcher');
var ChainMatcher = require('../ast/matchers/chainMatcher');
var GlobMatcher = require('../ast/matchers/globMatcher');

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
            matcher = new DQStringMatcher(tape);
        } else if (c === '(') {
            matcher = new JSMatcher(tape);
        } else if (c === '|' || c === '&') {
            matcher = new ChainMatcher(tape);
        } else if (c === '>' || c === '<' || /^\d$/.test(c)) {
            tape.setMark();
            tape.pushMark();
            matcher = new RedirMatcher(tape);
            token = matcher.run();
            if (token.type === matcher.tokens.NOTREDIR) {
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
        var t = matcher.run();
//        console.log('got a token ' + t.type + ': ' + t.text);
        tokens.push(t);
    }

    return tokens;
};