var StateMachine = require('./stateMachine');

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

var START = 'start';
var SEPARATOR = 'separator';
var PATH_ELEMENT = 'path_element';
var PATH_ELEMENT_e = 'path_element_escaping';
var DOT = 'dot';
var DOTDOT = 'dotdot';
var TILDE = 'tilde';
var NOT_A_PATH = 'not_a_path';
var DOTS = 'dots';


var tokenizer2 = new StateMachine(
);

tokenizer2.on(START, /\s/, function () {
});

tokenizer2.on(START, '.', function () {
    this.state = DOT;
});

tokenizer2.on(START, '/', function () {
    this.outcome = ABSOLUTE;
    this.state = SEPARATOR;
});

tokenizer2.on(START, '~', function () {
    this.state = TILDE;
});

tokenizer2.on(START, '\\', function () {
    this.outcome = RELATIVE;
    this.state = PATH_ELEMENT_e;
});

tokenizer2.on(START, /./, function () {
    this.outcome = RELATIVE;
    this.state = PATH_ELEMENT;
});

/**/

tokenizer2.on(SEPARATOR, /\s/, function () {
    this.stop();
});

tokenizer2.on(SEPARATOR, '.', function () {
    this.state = DOT;
});

tokenizer2.on(SEPARATOR, '/', function () {
    this.outcome = NOT_A_PATH;
    this.stop();
});

tokenizer2.on(SEPARATOR, '\\', function () {
    this.state = PATH_ELEMENT_e;
});

tokenizer2.on(SEPARATOR, /./, function () {
    this.state = PATH_ELEMENT;
});

/**/

tokenizer2.on(DOT, /\s/, function () {
    this.outcome = DOTS;
    this.stop();
});

tokenizer2.on(DOT, '.', function () {
    this.state = DOTDOT;
});

tokenizer2.on(DOT, '/', function () {
    this.outcome = DOTS;
    this.state = SEPARATOR;
});

tokenizer2.on(DOT, '\\', function () {
    if (!this.outcome) {
        this.outcome = RELATIVE;
    }
    this.state = PATH_ELEMENT_e;
});

tokenizer2.on(DOT, /./, function () {
    if (!this.outcome) {
        this.outcome = RELATIVE;
    }
    this.state = PATH_ELEMENT;
});

/**/

tokenizer2.on(DOTDOT, /\s/, function () {
    this.outcome = DOTS;
    this.stop();
});

tokenizer2.on(DOTDOT, '/', function () {
    this.outcome = DOTS;
    this.state = SEPARATOR;
});

tokenizer2.on(DOTDOT, '\\', function () {
    if (!this.outcome) {
        this.outcome = RELATIVE;
    }
    this.state = PATH_ELEMENT_e;
});

tokenizer2.on(DOTDOT, /./, function () {
    if (!this.outcome) {
        this.outcome = RELATIVE;
    }
    this.state = PATH_ELEMENT;
});

/**/

tokenizer2.on(TILDE, /\s/, function () {
    this.outcome = TILDE;
    this.stop();
});

tokenizer2.on(TILDE, '/', function () {
    this.outcome = TILDE;
    this.state = SEPARATOR;
});

tokenizer2.on(TILDE, '\\', function () {
    this.outcome = RELATIVE;
    this.state = PATH_ELEMENT_e;
});

tokenizer2.on(TILDE, /^.$/, function () {
    this.outcome = RELATIVE;
    this.state = PATH_ELEMENT;
});

tokenizer2.on(TILDE, tokenizer2.EOF, function () {
    this.outcome = TILDE;
    this.stop();
});

/**/

tokenizer2.on(PATH_ELEMENT, /\s/, function () {
    this.stop();
});

tokenizer2.on(PATH_ELEMENT, '/', function () {
    this.state = SEPARATOR;
});

tokenizer2.on(PATH_ELEMENT, '\\', function () {
    this.state = PATH_ELEMENT_e;
});

tokenizer2.on(PATH_ELEMENT, /./, function () {
});

/**/

tokenizer2.on(PATH_ELEMENT_e, /./, function () {
});

/**/

var Tape = require('./../../src/parser/linePointer');
var tape = new Tape('~');
tokenizer2.next = tape.next.bind(tape);
tokenizer2.hasMore = tape.hasMore.bind(tape);
tokenizer2.state = START;
tokenizer2.run();
console.log('Stopped at ' + tape.pos + ', returned: ' + tokenizer2.outcome);

// LESSONS
// ALLOW .on() TO HAVE ONLY 2 ARGUMENTS, IN WHICH THIS IS THE DEFAULT HANDLER FOR ALL INCOMING TERMS WITHOUT AN EXPLICIT HANDLER
// SECOND ARGUMENT SHOULD PROBABLY BE A STRING WHICH IS TURNED INTO A REGEX: ALLOWING A REGEX DIRECTLY IS INTERESTING BUT IS CONFUSING BECAUSE IT WILL BE TESTED AGAINST THE WHOLE INCOMING TERM, WHICH SHOULD BE ONLY ONE CHARACTER. THEN AGAIN, WHEN THIS IS NO LONGER A SINGLE CHARACTER STREAM AND SOMETHING ELSE, THIS LOGIC IS BROKEN?
// ALLOW PASSING SECOND ARGUMENT AS AN OBJECT TO AVOID SO MANY CALLS (FOR THIS TO WORK, WE HAVE TO TAKE A STRING INSTEAD OF REGEX AS SAID IN THE PREVIOUS POINT)
//was 20 lines:
tokenizer2.on(START, /\s/, function () {
});
tokenizer2.on(START, '.', function () {
    this.state = DOT;
});
tokenizer2.on(START, '/', function () {
    this.outcome = ABSOLUTE;
    this.state = SEPARATOR;
});
tokenizer2.on(START, '~', function () {
    this.state = TILDE;
});
tokenizer2.on(START, '\\', function () {
    this.outcome = RELATIVE;
    this.state = PATH_ELEMENT_e;
});
tokenizer2.on(START, /./, function () {
    this.outcome = RELATIVE;
    this.state = PATH_ELEMENT;
});

// now is 21 -_-' but more readable?
tokenizer2.on(START, {
    '\\s': function () {},
    '\\.': function () {
        this.state = DOT;
    },
    '\\/': function () {
        this.outcome = ABSOLUTE;
        this.state = SEPARATOR;
    },
    '~': function () {
        this.state = TILDE;
    },
    '\\\\': function () {
        this.outcome = RELATIVE;
        this.state = PATH_ELEMENT_e;
    },
    '.': function () {
        this.outcome = RELATIVE;
        this.state = PATH_ELEMENT;
    }
});

// WE STILL NEED EOF

/**********************************************************************************************************************/

