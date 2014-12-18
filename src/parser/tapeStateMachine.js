var StateMachine = require('./stateMachine');
var util = require('util');

var TapeStateMachine = module.exports = function (tape) {
    StateMachine.call(this);
    this.tape = tape;
    this.next = tape.next.bind(tape);
    this.hasMore = tape.hasMore.bind(tape);
};

util.inherits(TapeStateMachine, StateMachine);
