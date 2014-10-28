//var StateMachine = require('./stateMachine');
var Tape = require('../../src/parser/linePointer');
//var FirstMatcher = require('./firstMatcher');
var JSMatcher = require('./jsMatcher');
var RedirMatcher = require('./redirMatcher');
var DQStringMatcher = require('./dqStringMatcher');
var ChainMatcher = require('./chainMatcher');
var GlobMatcher = require('./globMatcher');
var util = require('util');
//var TapeStateMachine = require('./tapeStateMachine');


process.stdin.on('data', function (line) {
    var tape = new Tape(line.toString());


    var matcher, c, tokens = [];
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
            matcher = new RedirMatcher(tape);
            // TODO DIGITS WITHOUT REDIR
        } else {
            matcher = new GlobMatcher(tape);
        }
        var t = matcher.run();
        tokens.push(t);
    }
    tokens.forEach(function (token) {
        console.log(token.type.id + '\t>' + token.text + '<');
    });


});

