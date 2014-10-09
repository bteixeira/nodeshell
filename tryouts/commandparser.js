var LinePointer = require('../src/parser/linePointer');

var START = 0;

var tape;


/* Go-and-return/loop inside approach */
function parse1 (input) {
    tape = new LinePointer(input);
    // ready state
    var found = [];
    var t;
    while (tape.hasMore()) {
        var c = tape.peek();
        if (isWS(c)) {
            t = ws();
        } else if (c === '|') {
            t = pipes();
        } else if (c === '&') {
            t = amps();
        } else {
            t = item();
        }
        found.push(t);
    }
    return found;
}

function ws () {
    while (tape.hasMore() && isWS(tape.peek())) {
        tape.next();
    }
    return 'WS';
}

function item () {
    var c = tape.peek();
    while (tape.hasMore() && !isWS(c) && c !== '|' && c !== '&') {
        tape.next();
        c = tape.peek();
    }
    return 'ITEM';
}

function pipes () {
    tape.next();
    if (tape.peek() === '|') {
        tape.next();
        return 'PIPES';
    } else {
        return 'PIPE';
    }
}

function amps () {
    tape.next();
    if (tape.peek() === '&') {
        tape.next();
        return 'AMPS';
    } else {
        return 'AMP';
    }
}

function isWS (what) {
    return /^\s+$/.test(what);
}


/***************************************************************************************************/
/* Go-and-return/loop outside approach */

var state = 'START';
var c;
var found = [];
function parse2 (input) {
    tape = new LinePointer(input);

    while (tape.hasMore()) {
        c = tape.next();
        if (state === 'START') {
            decide(c);
        }

        if (state === 'WHITESPACE') {
            ws2();
        } else if (state === 'PIPE') {
            pipe2();
        } else if (state === 'DPIPE') {
            pipes2();
        } else if (state === 'AMP') {
            amp2();
        } else if (state === 'DAMP') {
            amps2();
        } else if (state === 'ITEM') {
            item2();
        }
//        if (isWS(c)) {
//            ws2();
//        } else if (c === '|') {
//            pipes2();
//        } else if (c === '&') {
//            amps2();
//        } else {
//            item2();
//        }
    }
    c = -1; // EOF
    if (state === 'WHITESPACE') {
        ws2();
    } else if (state === 'PIPE') {
        pipe2();
    } else if (state === 'DPIPE') {
        pipes2();
    } else if (state === 'AMP') {
        amp2();
    } else if (state === 'DAMP') {
        amps2();
    } else if (state === 'ITEM') {
        item2();
    }
    return found;
}

function pop (x) {
    found.push(x);
}

function decide (c) {
    if (isWS(c)) {
        state = 'WHITESPACE';
    } else if (c === '|') {
        state = 'PIPE';
    } else if (c === '&') {
        state = 'AMP';
    } else if (c === -1) {
        state = 'END';
    } else {
        state = 'ITEM';
    }
}

function ws2 () {
    if (!isWS(c)) {
        pop('ws');
        decide(c);
    }
}

function item2 () {
    if (isWS(c) || c === '|' || c === '&') {
        pop('item');
        decide(c);
    }
}

function pipe2 () {
    if (c === '|') {
        state = 'DPIPE';
    } else {
        pop('pipe');
        decide(c);
    }
}
function pipes2 () {
    pop('dpipe');
    decide(c);
}

function amp2 () {
    if (c === '&') {
        state = 'DAMP';
    } else {
        pop('amp');
        decide(c);
    }
}
function amps2 () {
    pop('damp');
    decide(c);
}


var terms;
terms = parse1(' git status |grep ".js"&& cd ..  ');
console.log(terms.join(' '));

terms = parse2(' git status |grep ".js"&& cd ..  ');
console.log(terms.join(' '));
