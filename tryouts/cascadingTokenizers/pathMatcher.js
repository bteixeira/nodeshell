var TapeStateMachine = require('./tapeStateMachine');
var util = require('util');
var utils = require('../../src/utils');

/***************************************************************/
/* usage example (command first token) */

//var tokenizer = new StateMachine({
//    states: {
//        phase: ['START', 'DOT', 'DOTDOT', 'SEPARATOR', 'PATH_ELEMENT'],
//        escaping: [true, false]
//    },
//    initial: {phase: 'START', escaping: false}
//});
//
//tokenizer.on({phase: ANY, escaping: true}, function (ch) {
//    this.state.escaping = false;
//});
//
//tokenizer.on({escaping: false, phase: START, ch: /\s/}, function () {
//    this.state.phase = WHITESPACE;
//});
//
//[START, false, /\./] : funtion () {
//    this.state = DOT;
//}


/********************************************************************/
/* ...usage example, no multi-state... */

var ESCAPABLES = {
    '0': '\0',
    'n': '\n',
    'r': '\r',
    'v': '\v',
    't': '\t',
    'b': '\b',
    'f': '\f'
};

var PathMatcher = module.exports = function (tape) {
    TapeStateMachine.call(this, tape);
    tape.setMark();
    this.state = st.START;

    var outcome;

    this.on(st.START, /\s/, function () {
        this.tape.setMark();
    });

    this.on(st.START, '.', function () {
        this.state = st.DOT;
        this.tape.pushMark();
    });

    this.on(st.START, '/', function () {
        this.outcome = t.ABSOLUTE_PATH;
        this.state = st.SEPARATOR;
        this.tape.pushMark();
    });

    this.on(st.START, '~', function () {
        console.log('tilde...');
        this.state = st.TILDE;
        this.tape.pushMark();
    });

    this.on(st.START, '\\', function () {
        this.outcome = t.RELATIVE_PATH;
        this.state = st.ESCAPING;
        this.tape.pushMark();
    });

    this.on(st.START, '*', function () {
        this.outcome = t.NOT_A_PATH;
        this.stop();
    });

    this.on(st.START, '?', function () {
        this.outcome = t.NOT_A_PATH;
        this.stop();
    });

    this.on(st.START, this.ANY, function () {
        this.outcome = t.RELATIVE_PATH;
        this.state = st.PATH_ELEMENT;
        this.tape.pushMark();
    });

    /**/

    this.on(st.SEPARATOR, /\s/, function () {
        this.tape.prev();
        this.stop();
    });

    this.on(st.SEPARATOR, '.', function () {
        this.state = st.DOT;
    });

    this.on(st.SEPARATOR, '/', function () {
        this.outcome = t.NOT_A_PATH;
        this.stop();
    });

    this.on(st.SEPARATOR, '\\', function () {
        this.state = st.ESCAPING;
    });

    this.on(st.SEPARATOR, '*', function () {
        this.outcome = t.NOT_A_PATH;
        this.stop();
    });

    this.on(st.SEPARATOR, '?', function () {
        this.outcome = t.NOT_A_PATH;
        this.stop();
    });

    this.on(st.SEPARATOR, this.ANY, function () {
        this.state = st.PATH_ELEMENT;
    });

    /**/

    this.on(st.DOT, /\s/, function () {
        this.tape.prev();
        this.outcome = t.DOTS_PATH;
        this.stop();
    });

    this.on(st.DOT, '.', function () {
        this.state = st.DOTDOT;
    });

    this.on(st.DOT, '/', function () {
        this.outcome = t.DOTS_PATH;
        this.state = st.SEPARATOR;
    });

    this.on(st.DOT, '\\', function () {
        if (!outcome) {
            this.outcome = t.RELATIVE_PATH;
        }
        this.state = st.ESCAPING;
    });

    this.on(st.DOT, '*', function () {
        this.outcome = t.NOT_A_PATH;
        this.stop();
    });

    this.on(st.DOT, '?', function () {
        this.outcome = t.NOT_A_PATH;
        this.stop();
    });

    this.on(st.DOT, this.ANY, function () {
        if (!outcome) {
            this.outcome = t.RELATIVE_PATH;
        }
        this.state = st.PATH_ELEMENT;
    });

    /**/

    this.on(st.DOTDOT, /\s/, function () {
        this.tape.prev();
        this.outcome = t.DOTS_PATH;
        this.stop();
    });

    this.on(st.DOTDOT, '/', function () {
        this.outcome = t.DOTS_PATH;
        this.state = st.SEPARATOR;
    });

    this.on(st.DOTDOT, '\\', function () {
        if (!outcome) {
            this.outcome = t.RELATIVE_PATH;
        }
        this.state = st.ESCAPING;
    });

    this.on(st.DOTDOT, '*', function () {
        this.outcome = t.NOT_A_PATH;
        this.stop();
    });

    this.on(st.DOTDOT, '?', function () {
        this.outcome = t.NOT_A_PATH;
        this.stop();
    });

    this.on(st.DOTDOT, this.ANY, function () {
        if (!outcome) {
            this.outcome = t.RELATIVE_PATH;
        }
        this.state = st.PATH_ELEMENT;
    });

    /**/

    this.on(st.TILDE, /\s/, function () {
        this.tape.prev();
        this.outcome = t.TILDE_PATH;
        this.stop();
    });

    this.on(st.TILDE, '/', function () {
        this.outcome = t.TILDE_PATH;
        this.state = st.SEPARATOR;
    });

    this.on(st.TILDE, '\\', function () {
        this.outcome = t.RELATIVE_PATH;
        this.state = st.ESCAPING;
    });

    this.on(st.TILDE, '*', function () {
        this.outcome = t.NOT_A_PATH;
        this.stop();
    });

    this.on(st.TILDE, '?', function () {
        this.outcome = t.NOT_A_PATH;
        this.stop();
    });

    this.on(st.TILDE, this.ANY, function () {
        this.outcome = t.RELATIVE_PATH;
        this.state = st.PATH_ELEMENT;
    });

    /**/

    this.on(st.PATH_ELEMENT, /\s/, function () {
        this.tape.prev();
        this.stop();
    });

    this.on(st.PATH_ELEMENT, '/', function () {
        this.state = st.SEPARATOR;
    });

    this.on(st.PATH_ELEMENT, '\\', function () {
        this.state = st.ESCAPING;
    });

    this.on(st.PATH_ELEMENT, '*', function () {
        this.outcome = t.NOT_A_PATH;
        this.stop();
    });

    this.on(st.PATH_ELEMENT, '?', function () {
        this.outcome = t.NOT_A_PATH;
        this.stop();
    });

    this.on(st.PATH_ELEMENT, this.ANY, function () {
    });

    /**/

    this.on(st.ESCAPING, this.ANY, function (ch) {
        this.tape.prev();
        this.chars.push(this.tape.getMarked());
        this.tape.next();
        if (ch in ESCAPABLES) {
            chars.push(ESCAPABLES[ch]);
        } else {
            chars.push(ch);
        }
        // TODO YOU PROBABLY WANT UNICODES TOO (\uXXXX and \xXX)
        this.tape.setMark();
        this.state = st.PATH_ELEMENT;
    });
};

util.inherits(PathMatcher, TapeStateMachine);

var st = PathMatcher.prototype.states = utils.createEnum('START', 'SEPARATOR', 'PATH_ELEMENT', 'ESCAPING', 'DOT', 'DOTDOT', 'TILDE');

var t = PathMatcher.prototype.tokens = utils.createEnum('NOT_A_PATH', 'RELATIVE_PATH', 'ABSOLUTE_PATH', 'DOTS_PATH', 'TILDE_PATH');

var run_ = TapeStateMachine.prototype.run;

PathMatcher.prototype.run = function () {
    this.stack = [];
    this.chars = [];
    run_.call(this);
    this.chars.push(this.tape.getMarked());
    this.tape.popMark();
    var tt = {
        type: this.outcome,
        text: this.tape.getMarked(),
        string: this.chars.join('')
    };
    console.log('||', tt);
    return tt;
};


/**/

//// LESSONS
//// ALLOW .on() TO HAVE ONLY 2 ARGUMENTS, IN WHICH THIS IS THE DEFAULT HANDLER FOR ALL INCOMING TERMS WITHOUT AN EXPLICIT HANDLER
//// SECOND ARGUMENT SHOULD PROBABLY BE A STRING WHICH IS TURNED INTO A REGEX: ALLOWING A REGEX DIRECTLY IS INTERESTING BUT IS CONFUSING BECAUSE IT WILL BE TESTED AGAINST THE WHOLE INCOMING TERM, WHICH SHOULD BE ONLY ONE CHARACTER. THEN AGAIN, WHEN THIS IS NO LONGER A SINGLE CHARACTER STREAM AND SOMETHING ELSE, THIS LOGIC IS BROKEN?
//// ALLOW PASSING SECOND ARGUMENT AS AN OBJECT TO AVOID SO MANY CALLS (FOR THIS TO WORK, WE HAVE TO TAKE A STRING INSTEAD OF REGEX AS SAID IN THE PREVIOUS POINT)
////was 20 lines:
//this.on(START, /\s/, function () {
//});
//this.on(START, '.', function () {
//    this.state = DOT;
//});
//this.on(START, '/', function () {
//    this.this.outcome = ABSOLUTE_PATH;
//    this.state = SEPARATOR;
//});
//this.on(START, '~', function () {
//    this.state = TILDE;
//});
//this.on(START, '\\', function () {
//    this.this.outcome = RELATIVE_PATH;
//    this.state = ESCAPING;
//});
//this.on(START, /./, function () {
//    this.this.outcome = RELATIVE_PATH;
//    this.state = PATH_ELEMENT;
//});
//
//// now is 21 -_-' but more readable?
//this.on(START, {
//    '\\s': function () {},
//    '\\.': function () {
//        this.state = DOT;
//    },
//    '\\/': function () {
//        this.this.outcome = ABSOLUTE_PATH;
//        this.state = SEPARATOR;
//    },
//    '~': function () {
//        this.state = TILDE;
//    },
//    '\\\\': function () {
//        this.this.outcome = RELATIVE_PATH;
//        this.state = ESCAPING;
//    },
//    '.': function () {
//        this.this.outcome = RELATIVE_PATH;
//        this.state = PATH_ELEMENT;
//    }
//});
//
//// WE STILL NEED EOF
//
///**********************************************************************************************************************/
//
