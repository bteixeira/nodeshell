var Pointer = require('./linePointer');
var NodeJS = require('../ast/nodes/nodeJS');
var NodeCMD = require('../ast/nodes/nodeCMD');
var NodeLiteral = require('../ast/nodes/nodeLiteral');
var NodeERR = require('../ast/nodes/nodeERR');

var Parser = function (commandSet) {
    this.commandSet = commandSet;
};

Parser.prototype.parse = function (input) {

    var pointer = new Pointer(input);
    var token;

    try {
        pointer.skipWS();
        pointer.setMark();
        pointer.skipNonWS();

        var first = pointer.getMarked();

        if (this.commandSet.isCmd(first)) {
            token = new NodeCMD(first);
            pointer.skipWS();
            while (pointer.hasMore()) {
                token.addArg(this.parseArg(pointer));
                pointer.skipWS();
            }
        } else {
            token = new NodeJS(input.trim());
        }
    } catch (ex) {
        token = new NodeERR(ex, pointer);
    }

    return token;
};

Parser.prototype.parseArg = function (pointer) {
    var c = pointer.peek();

    if (c === '(') { // JS
        pointer.next();
        pointer.setMark();
        this.skipJS(pointer); // will set cursor at matching ')'
        var code = pointer.getMarked().trim();
        pointer.next();
        return new NodeJS(code);
    } else {
        pointer.setMark();
        pointer.skipNonWS();
        return new NodeLiteral(pointer.getMarked());
    }
};

// TODO QUALIFY THESE AS EXPORTS SO THAT EXTERNAL CODE CAN REFERENCE THEM
var NON_MATCHING = 'Found closing brace without matching opening brace';
var UNTERMINATED = 'Unterminated JS (opening brace without matching closing brace)'; // TODO LET UPPER-LEVEL KNOW WHICH BRACE AND WHERE

Parser.prototype.skipJS = function (pointer) {

    var stack = [];
    var c;

    while (c = pointer.next()) {
        if ('({['.indexOf(c) !== -1) {
            stack.push(c);
        } else if (c === ')') {
            if (stack.slice(-1)[0] === '(') {
                stack.pop();
            } else if (!stack.length) {
                pointer.prev();
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
            pointer.skipTo('"'); // TODO ERROR QUOTE COULD BE ESCAPED
            pointer.next();
        } else if (c === "'") {
            pointer.skipTo("'"); // TODO ERROR QUOTE COULD BE ESCAPED
            pointer.next();
        }
    }

    throw UNTERMINATED;
};

module.exports = Parser;
