var Tape = require('../tape');

var NodeJS = require('../ast/nodes/nodeJS');
var NodeCMD = require('../ast/nodes/nodeCMD');
var NodeLiteral = require('../ast/nodes/nodeLiteral');
var NodeERR = require('../ast/nodes/nodeERR');

/**
 * A parser for lines of input in the shell.
 * Use the parse method to parse a string of input. It returns the top-most node of the AST. All other methods should
 * not be needed and will probably be removed in the future.
 *
 * @param checkCmd a function which, given a string, returns true if that string is the name of a command
 * @constructor
 */
var Parser = function (commandSet) {
    this.commandSet = commandSet;
};

Parser.prototype.parse = function (input) {

    var tape = new Tape(input);
    var token;

    try {
        tape.skipWS();
        tape.setMark();
        tape.skipNonWS();

        var first = tape.getMarked();

        if (this.commandSet.isCmd(first)) {
            token = new NodeCMD(first);
            tape.skipWS();
            while (tape.hasMore()) {
                token.addArg(this.parseArg(tape));
                tape.skipWS();
            }
        } else {
            token = new NodeJS(input.trim());
        }
    } catch (ex) {
        token = new NodeERR(ex, tape);
    }

    return token;
};

/**
 * Given a tape, parses a command argument (either JS or literal) starting from the current position of the
 * tape. Returns an AST node with the argument. Moves the tape to the character after the argument.
 * @param tape
 * @returns {*} AST node, either JS or literal
 */
Parser.prototype.parseArg = function (tape) {
    var c = tape.peek();

    if (c === '(') { // JS
        tape.next();
        tape.setMark();
        this.skipJS(tape); // will set cursor at matching ')'
        var code = tape.getMarked().trim();
        tape.next();
        return new NodeJS(code);
    } else {
        tape.setMark();
        tape.skipNonWS();
        return new NodeLiteral(tape.getMarked());
    }
};

// TODO QUALIFY THESE AS EXPORTS SO THAT EXTERNAL CODE CAN REFERENCE THEM
var NON_MATCHING = 'Found closing brace without matching opening brace';
var UNTERMINATED = 'Unterminated JS (opening brace without matching closing brace)'; // TODO LET UPPER-LEVEL KNOW WHICH BRACE AND WHERE

/**
 * Given a tape, moves the tape to the end of the javascript fragment at the current position of the tape.
 * @param tape
 */
Parser.prototype.skipJS = function (tape) {

    var stack = [];
    var c;

    while (c = tape.next()) {
        if ('({['.indexOf(c) !== -1) {
            stack.push(c);
        } else if (c === ')') {
            if (stack.slice(-1)[0] === '(') {
                stack.pop();
            } else if (!stack.length) {
                tape.prev();
                return;
            } else {
                throw NON_MATCHING;
            }
        } else if (c === '}') {
            if (stack.slice(-1)[0] === '{') {
                stack.pop();
            } else {
                throw NON_MATCHING;
            }
        } else if (c === ']') {
            if (stack.slice(-1)[0] === '[') {
                stack.pop();
            } else {
                throw NON_MATCHING;
            }
        } else if (c === '"') {
            tape.skipTo('"'); // TODO ERROR QUOTE COULD BE ESCAPED
            tape.next();
        } else if (c === "'") {
            tape.skipTo("'"); // TODO ERROR QUOTE COULD BE ESCAPED
            tape.next();
        }
    }

    throw UNTERMINATED;
};

module.exports = Parser;
