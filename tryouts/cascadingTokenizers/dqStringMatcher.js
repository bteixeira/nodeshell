var TapeStateMachine = require('./tapeStateMachine');
var util = require('util');
var utils = require('../../src/utils');

var ESCAPABLES = {
    '0': '\0',
    'n': '\n',
    'r': '\r',
    'v': '\v',
    't': '\t',
    'b': '\b',
    'f': '\f'
};

var DQStringMatcher = module.exports = function (tape) {
    TapeStateMachine.call(this, tape);
    tape.setMark();
    this.state = st.START;


    this.on(st.START, /\s/, function () {
        tape.setMark();
    });
    this.on(st.START, '"', function () {
        this.state = st.INSIDE;
        this.tape.pushMark();
        this.tape.setMark();
    });
    this.on(st.START, this.ANY, function () {
        this.token = {
            type: t.NO_DQSTRING,
            text: this.tape.getMarked()
        };
        this.stop();
    });


    var chars = [];


    this.on(st.INSIDE, '"', function () {
        var tape = this.tape;
        tape.prev();
        chars.push(tape.getMarked());
        tape.next();
        tape.popMark();
        this.token = {
            type: t.DQSTRING,
            text: tape.getMarked(),
            string: chars.join('') // fortunately, 'string' is not a reserved word
        };
        this.stop();
    });
    this.on(st.INSIDE, '\\', function () {
        var tape = this.tape;
        tape.prev();
        chars.push(tape.getMarked());
        tape.next();
        tape.setMark();
        this.state = st.ESCAPING;
    });
    this.on(st.INSIDE, this.EOF, function () {
        var tape = this.tape;
        chars.push(tape.getMarked());
        tape.popMark();
        this.token = {
            type: t.UNTERMINATED_DQSTRING,
            text: tape.getMarked(),
            string: chars.join('')
        };
    });
    this.on(st.INSIDE, this.ANY, function () {
    });


    this.on(st.ESCAPING, this.EOF, function () {
        var tape = this.tape;
        tape.popMark();
        this.token = {
            type: t.UNTERMINATED_ESCAPING_DQSTRING,
            text: tape.getMarked(),
            string: chars.join('')
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

util.inherits(DQStringMatcher, TapeStateMachine);

var st = DQStringMatcher.prototype.states = utils.createEnum('START', 'INSIDE', 'ESCAPING');

var t = DQStringMatcher.prototype.tokens = utils.createEnum('DQSTRING', 'NO_DQSTRING', 'UNTERMINATED_DQSTRING', 'UNTERMINATED_ESCAPING_DQSTRING');

var run_ = TapeStateMachine.prototype.run;

DQStringMatcher.prototype.run = function () {
    this.stack = [];
    run_.call(this);
    return this.token;
};
