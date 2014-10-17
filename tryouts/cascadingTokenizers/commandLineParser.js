var StateMachine = require('./stateMachine');
var Tape = require('../../src/parser/linePointer');
//var FirstMatcher = require('./firstMatcher');
var JSMatcher = require('./jsMatcher');
var util = require('util');


process.stdin.on('data', function (line) {
//    console.log('instantiating tape for [' + line + ']');
    var tape = new Tape(line.toString());
//    console.log('instantiated tape [' + tape + ']');

//    var firstMatcher = new FirstMatcher(tape);
//    var first = firstMatcher.run();
//    var tokens = [];
//
//    if (first.type === FirstMatcher.NOT_A_PATH) {
//        console.log('Doesn\'t seem to be a command name or path, assuming JS');
//        return;
//    }
//
//    tokens.push(first);
    var jsm = new JSMatcher(tape);
//    console.log('>>', jsm.tape.line, jsm.tape.line === line);
    var token = jsm.run();
    console.log(util.inspect(token));

});


//var CLMatcher = function (input) {
//    StateMachine.call(this);
//};
//
//util.inherits(CLMatcher, StateMachine);
