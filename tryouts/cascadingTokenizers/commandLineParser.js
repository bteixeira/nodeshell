//var StateMachine = require('./stateMachine');
var Tape = require('../../src/tape');
var PathMatcher = require('./pathMatcher');
var JSMatcher = require('./jsMatcher');
var RedirMatcher = require('./redirMatcher');
var DQStringMatcher = require('./dqStringMatcher');
var ChainMatcher = require('./chainMatcher');
var GlobMatcher = require('./globMatcher');
var util = require('util');
require('colors');
//var TapeStateMachine = require('./tapeStateMachine');


//process.stdin.on('data', function (line) {
//
//    var tokens = parse(line);
//
//    tokens.forEach(function (token) {
//        console.log(token.type.id + '\t|'.red + token.text + '|'.red);
//    });
//
//});

var parse = module.exports = function (line) {
    var tape = new Tape(line.toString());

    var matcher, c, tokens = [];
    var token;
//    matcher = new PathMatcher(tape);
//    var token = matcher.run();
//    if (token.type === PathMatcher.NOT_A_PATH) {
//        console.log('first token does not seem to be a path (' + token.text + '), aborting');
//        return;
//    } else {
//        tokens.push(token);
//    }

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
            tape.pushMark();
            matcher = new RedirMatcher(tape);
            token = matcher.run();
            if (token.type === RedirMatcher.NOTREDIR) {
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
        tokens.push(t);
    }

    return tokens;
};

