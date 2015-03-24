//var TapeStateMachine = require('../../parser/tapeStateMachine');
var util = require('util');
var utils = require('../../utils');

/**
 * Allowed sequences:
 *      [0-9]*>
 *      [0-9]*>>
 *      [0-9]*>&
 *      [0-9]*<
 *      [0-9]*<>
 *      [0-9]*<&
 */

exports.run = function (tape) {
    tape.pushMark();
    tape.setMark();

    var c = tape.next();
    var type, fd;

    if (/\d/.test(c)) {
        while (/\d/.test(tape.peek())) {
            tape.next();
        }
        fd = tape.getMarked();
        c = tape.next();
    }

    if (c === '>') {
        if (tape.peek() === '>') {
            tape.next();
            type = t.GTGT;
        } else if (tape.peek() === '&') {
            tape.next();
            type = t.GTAMP;
        } else {
            type = t.GT;
        }
    } else if (c === '<') {
        if (tape.peek() === '>') {
            tape.next();
            type = t.LTGT;
        } else if (tape.peek() === '&') {
            tape.next();
            type = t.LTAMP;
        } else {
            type = t.LT;
        }
    } else {
        tape.prev();
        type = t.NOTREDIR;
    }

    var text = tape.getMarked();
    var pos = tape.popMark();

    return {
        type: type,
        text: text,
        pos: pos,
        fd: fd
    };
};

//var RedirMatcher = module.exports = function (tape) {
//    TapeStateMachine.call(this, tape);
//    tape.setMark();
//    this.state = st.START;
//
//
//    this.on(st.START, /\s/, function () {
//        this.tape.setMark();
//    });
//    this.on(st.START, /\d/, function () {
//        this.state = st.NUMBER;
//    });
//    this.on(st.START, '>', function () {
//        this.state = st.GT;
//    });
//    this.on(st.START, '<', function () {
//        this.state = st.LT;
//    });
//    this.on(st.START, this.ANY, function () {
//        this.notRedir();
//    });
//
//
//    var number = null;
//    this.on(st.NUMBER, /\d/, function () {
//    });
//    this.on(st.NUMBER, '>', function () {
//        number = this.tape.getMarked();
//        number = number.substring(0, number.length - 1);
//        this.state = st.GT;
//    });
//    this.on(st.NUMBER, '<', function () {
//        number = this.tape.getMarked();
//        number = number.substring(0, number.length - 1);
//        this.state = st.LT;
//    });
//    this.on(st.NUMBER, this.ANY, function () {
//        this.notRedir();
//    });
//
//
//    this.on(st.GT, this.ANY, function (ch) {
//        var type;
//        if (ch === '>') {
//            type = t.GTGT;
//        } else if (ch === '&') {
//            type = t.GTAMP;
//        } else {
//            type = t.GT;
//            if (ch !== this.EOF) {
//                this.tape.prev();
//            }
//        }
//        this.token = {
//            type: type,
//            text: this.tape.getMarked()
//        };
//        this.token.number = number;
//        this.stop();
//    });
//
//
//    this.on(st.LT, this.ANY, function (ch) {
//        var type;
//        if (ch === '>') {
//            type = t.LTGT;
//        } else if (ch === '&') {
//            type = t.LTAMP;
//        } else {
//            type = t.LT;
//            if (ch !== this.EOF) {
//                this.tape.prev();
//            }
//        }
//        this.token = {
//            type: type,
//            text: this.tape.getMarked()
//        };
//        this.token.number = number;
//        this.stop();
//    });
//
//};
//
//util.inherits(RedirMatcher, TapeStateMachine);
//
//var st = RedirMatcher.prototype.states = utils.createEnum('START', 'NUMBER', 'GT', 'LT');

var t = exports.tokens = utils.createEnum('NOTREDIR', 'GT', 'GTGT', 'GTAMP', 'LT', 'LTGT', 'LTAMP');

//var run_ = TapeStateMachine.prototype.run;
//
//RedirMatcher.prototype.run = function () {
//    this.stack = [];
//    run_.call(this);
//    return this.token;
//};
//RedirMatcher.prototype.notRedir = function () {
//    this.token = {type: t.NOTREDIR, text: this.tape.getMarked()};
//    this.stop();
//};
