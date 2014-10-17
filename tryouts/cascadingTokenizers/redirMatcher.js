var TapeStateMachine = require('./tapeStateMachine');
var util = require('util');
var utils = require('../../src/utils');

var RedirMatcher = module.exports = function (tape) {
    TapeStateMachine.call(this, tape);
    tape.setMark();
    this.state = st.START;


    this.on(st.START, /\s/, function () {
        tape.setMark();
    });
    this.on(st.START, /\d/, function () {
        this.state = st.NUMBER;
    });
    this.on(st.START, '>', function () {
        this.state = st.GT;
    });
    this.on(st.START, '<', function () {
        this.state = st.LT;
    });


    var first;
    this.on(st.NUMBER, /\d/, function () {
    });
    this.on(st.NUMBER, '>', function () {
        first = this.tape.getMarked();
        first = first.substring(0, first.length - 1);
        this.state = st.GT;
    });
    this.on(st.NUMBER, '<', function () {
        first = this.tape.getMarked();
        first = first.substring(0, first.length - 1);
        this.state = st.LT;
    });
    this.on(st.NUMBER, this.ANY, function () {
        this.notRedir();
    });


    this.on(st.GT, '>', function () {

    });

};

util.inherits(RedirMatcher, TapeStateMachine);

var st = RedirMatcher.prototype.states = utils.createEnum('START', 'NUMBER', 'GT', 'LT');

var t = RedirMatcher.prototype.tokens = utils.createEnum('NOTREDIR', 'GT', 'GTGT', 'GTAMP', 'LT', 'LTGT', 'LTAMP');

var run_ = TapeStateMachine.prototype.run;

RedirMatcher.prototype.run = function () {
    this.stack = [];
    run_.call(this);
    return this.token;
};
RedirMatcher.prototype.notRedir = function () {
    this.token = {type: t.NOTREDIR, text: this.tape.getMarked()};
    this.stop();
};
