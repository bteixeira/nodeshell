// Matches command chainers ('|', '&', '||' or '&&')

var TapeStateMachine = require('./tapeStateMachine');
var util = require('util');
var utils = require('../../src/utils');

var ChainMatcher = module.exports = function (tape) {
    TapeStateMachine.call(this, tape);
    tape.setMark();
    this.state = st.START;


    this.on(st.START, /\s/, function () {
        tape.setMark();
    });
    this.on(st.START, '&', function () {
        this.state = st.AMP;
    });
    this.on(st.START, '|', function () {
        this.state = st.PIPE;
    });
    this.on(st.START, this.ANY, function () {
        this.notChain();
    });


    this.on(st.AMP, '&', function () {
        this.token = {type: t.DAMP, text: this.tape.getMarked()};
        this.stop();
    });
    this.on(st.AMP, this.ANY, function (ch) {
        if (ch !== this.EOF) {
            this.tape.prev();
        }
        this.token = {type: t.AMP, text: this.tape.getMarked()};
        this.stop();
    });


    this.on(st.PIPE, '|', function () {
        this.token = {type: t.DPIPE, text: this.tape.getMarked()};
        this.stop();
    });
    this.on(st.PIPE, this.ANY, function (ch) {
        if (ch !== this.EOF) {
            this.tape.prev();
        }
        this.token = {type: t.PIPE, text: this.tape.getMarked()};
        this.stop();
    });

};

util.inherits(ChainMatcher, TapeStateMachine);

var st = ChainMatcher.prototype.states = utils.createEnum('START', 'AMP', 'PIPE');

var t = ChainMatcher.prototype.tokens = utils.createEnum('AMP', 'PIPE', 'DAMP', 'DPIPE', 'NOT_CHAIN');

var run_ = TapeStateMachine.prototype.run;

ChainMatcher.prototype.run = function () {
    this.stack = [];
    run_.call(this);
    return this.token;
};
ChainMatcher.prototype.notChain = function () {
    this.token = {type: t.NOT_CHAIN, text: this.tape.getMarked()};
    this.stop();
};
