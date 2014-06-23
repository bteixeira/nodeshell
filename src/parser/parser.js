var Pointer = require(__dirname + '/linepointer');
var TokenJS = require(__dirname + '/../ast/NodeJS');
var TokenCMD = require(__dirname + '/../ast/NodeCMD');
var TokenLiteral = require(__dirname + '/../ast/NodeLiteral');
var TokenERR = require(__dirname + '/../ast/NodeERR');

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
            token = new TokenCMD(first);
            pointer.skipWS();
            while (pointer.hasMore()) {
                token.addArg(this.parseArg(pointer));
                pointer.skipWS();
            }
        } else {
            token = new TokenJS(input.trim());
        }
    } catch (ex) {
        token = new TokenERR(ex, pointer);
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
        return new TokenJS(code);
    } else {
        pointer.setMark();
        pointer.skipNonWS();
        return new TokenLiteral(pointer.getMarked());
    }
};

// TODO QUALIFY THESE AS EXPORTS SO THAT EXTERNAL CODE CAN REFERENCE THEM
var NON_MATCHING = 'Found closing brace without matching opening brace';
var UNTERMINATED = 'Unterminated JS (opening brace without matching closing brace)'; // TODO LET TOP-LEVEL KNOW WHICH BRACE AND WHERE

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
