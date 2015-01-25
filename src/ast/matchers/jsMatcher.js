var TapeStateMachine = require('../../parser/tapeStateMachine');
var util = require('util');
var utils = require('../../utils');

var JSMatcher = module.exports = function (tape) {
    TapeStateMachine.call(this, tape);
    tape.setMark();
    this.state = st.START;


    this.on(st.START, /\s/, function () {
        tape.setMark();
    });
    this.on(st.START, '(', function () {
        this.state = st.INSIDE;
        tape.pushMark();
        tape.setMark();
    });
    this.on(st.START, this.ANY, function () {
        this.error();
    });


    this.on(st.INSIDE, /[\(\[\{]/, function (ch) {
        this.stack.push(ch);
    });
    this.on(st.INSIDE, ']', function (ch) {
        if (this.stack[this.stack.length - 1] === '[') {
            this.stack.pop();
        } else {
            this.error();
        }
    });
    this.on(st.INSIDE, '}', function (ch) {
        if (this.stack[this.stack.length - 1] === '{') {
            this.stack.pop();
        } else {
            this.error();
        }
    });
    this.on(st.INSIDE, ')', function (ch) {
        if (this.stack[this.stack.length - 1] === '(') {
            this.stack.pop();
        } else {
            this.tape.prev();
            var js = this.tape.getMarked();
            this.tape.next();
            this.tape.popMark();
            this.token = {type: t.JSToken, text: this.tape.getMarked(), js: js};
            this.stop();
        }
    });
    this.on(st.INSIDE, '"', function () {
        this.state = st.DQSTRING;
    });
    this.on(st.INSIDE, '\'', function () {
        this.state = st.SQSTRING;
    });
    this.on(st.INSIDE, this.EOF, function () {
        this.error();
    });
    this.on(st.INSIDE, this.ANY, function () {
    });


    var escaping = false;
    this.on(st.DQSTRING, '\\', function () {
        if (escaping) {
            escaping = false; // skip this char and do nothing
        } else {
            escaping = true;
        }
    });
    this.on(st.DQSTRING, '"', function () {
        if (escaping) {
            escaping = false; // skip this char and do nothing
        } else {
            this.state = st.INSIDE;
        }
    });
    this.on(st.DQSTRING, this.ANY, function () {
        if (escaping) {
            escaping = false; // skip this char and do nothing
        }
    });

    this.on(st.SQSTRING, '\\', function () {
        escaping = !escaping;
    });
    this.on(st.SQSTRING, '\'', function () {
        if (escaping) {
            escaping = false; // skip this char and do nothing
        } else {
            this.state = st.INSIDE;
        }
    });
    this.on(st.SQSTRING, this.ANY, function () {
        if (escaping) {
            escaping = false; // skip this char and do nothing
        }
    });

};

util.inherits(JSMatcher, TapeStateMachine);

var st = JSMatcher.prototype.states = utils.createEnum('START', 'INSIDE', 'DQSTRING', 'SQSTRING');

var t = JSMatcher.prototype.tokens = utils.createEnum('ErrorToken', 'JSToken');

var run_ = TapeStateMachine.prototype.run;

JSMatcher.prototype.run = function () {
    this.stack = [];
    run_.call(this);
    return this.token;
};
JSMatcher.prototype.error = function () {
    this.token = {type: t.ErrorToken, text: this.tape.getMarked()};
    this.stop();
};
