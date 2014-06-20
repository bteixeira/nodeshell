var Commands = require(__dirname + '/commandsStub');
var Pointer = require(__dirname + '/linepointer');
var TokenJS = require(__dirname + '/TokenJS');
var TokenCMD = require(__dirname + '/TokenJS');
var TokenLiteral = require(__dirname + '/TokenJS');

var Parser = function () {

};

Parser.prototype.parse = function (input) {

    var pointer = new Pointer(input);
    pointer.skipWS();
    pointer.mark();
    pointer.skipNonWS();

    var first = pointer.getMarked();
    var token;

    if (Commands.isCmd(first)) {
        token = new TokenCMD(first);
        pointer.skipWS();
        while (pointer.hasMore()) {
            token.addArg(this.parseArg());
            pointer.skipWS();
        }
    } else {
        token = new TokenJS(input.trim());
    }

    return token;
};

Parser.prototype.parseArg = function (pointer) {
    var c = pointer.peek();

    if (c === '(') { // JS
        pointer.next();
        pointer.mark();
        //...
        this.skipJS(pointer); // will set cursor at matching ')'
        var code = pointer.getMarked().trim();
        pointer.next();
        return new TokenJS(code);
    } else {
        pointer.mark();
        pointer.skipNonWS();
        return new TokenLiteral(pointer.getMarked());
    }
};

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
                return;
            }
        } else if (c === '}' && stack.slice(-1)[0] === '{') {
            stack.pop();
        } else if (c === ']' && stack.slice(-1)[0] === '[') {
            stack.pop();
        } else if (c === '"') {
            pointer.skipTo('"');
            pointer.next();
        } else if (c === "'") {
            pointer.skipTo("'");
            pointer.next();
        }
    }
};
