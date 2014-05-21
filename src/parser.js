var util = require('util');
var vm = require('vm');

var Parser = function (options) {
    this.commands = options.commands;
//    console.log('what is this?', this);
};

Parser.prototype.exec = function (line) {
    return runLine(line, this.commands);
};

var ctx = vm.createContext({
    process: process
});

/***** COPIED FROM PROTO *****/
function runLine (line, commands) {
    var match = line.match(/^[a-zA-Z_0-9\-\.]+\s*/);
    var cmd;
    if (match && (cmd = commands.getCmd(match[0].trim()))) {
        // parse rest of line for JS expressions in parentheses, or literals
        var args = parseArguments(line, match[0].length);
        // run command with found arguments
        args = args.map(function (val) {
            try {
                console.log('evaling', val);
                //return eval(val);
                return vm.runInContext(val, ctx);
            } catch (e) {
                console.log(val, 'is not JS', e.message);
                return val;
            }
        });
        console.log('Transformed these args');
        console.log(util.inspect(args));
        return cmd.apply(null, args);
    } else {
        //run whole line as JS
//        return eval(line);
        return vm.runInContext(line, ctx);
    }
}

/**
 * Given a line, returns an array of strings to be used as arguments for commands.
 * Each string is always either a whitespace-free string, or a fragment of Javascript code to be eval'd.
 * @param line the line to parse
 * @param start the index at which to start parsing
 * @returns {Array}
 */
function parseArguments (line, start) {
    var args = [];
    var i, c, mark = start;
    for (i = start; i < line.length ; i++) {
        c = line.charAt(i);
        if (c === '(') {
            console.log('character is', c, ' running nesting');
            i = runNesting(line, i + 1);
        } else {
            console.log('character is', c, ' running to ws');
            i = runToWS(line, i + 1);
        }
        args.push(line.substring(mark, i));
        mark = 1;
    }
    console.log('Found these args');
    console.log(util.inspect(args));
    return args;
}

/**
 * Assumes the current position is the start of a Javascript nesting (either '(', '{' or '[') and returns the position where it ends. Jumps over any further nesting and strings.
 */
function runNesting (line, start) {
    var nesting = [line.charAt(start)];
    var i, c;
    for (i = start + 1 ; i < line.length ; i++) {
        c = line.charAt(i);
        if (c === '"') {
            i = runDQString(line, i + 1);
        } else if (c === "'") {
            i = runSQString(line, i + 1);
        } else if ('({['.indexOf(c) !== -1) {
            nesting.push(c);
        } else if (c === ')' && nesting[nesting.length] === '(') {
            nesting.pop();
        } else if (c === '}' && nesting[nesting.length] === '{') {
            nesting.pop();
        } else if (c === ']' && nesting[nesting.length] === '[') {
            nesting.pop();
        }
        if (!nesting.length) {
            return i;
        }
    }
    return i;
}

/**
 * Assumes the current position is the start of a double-quoted string and returns the position where it ends.
 */
function runDQString (line, start) {
    var i, c, escaping = false;
    for (i = start ; i < line.length ; i++) {
        c = line.charAt(i);
        if (escaping) {
            escaping = false;
        } else if (c === '\\') {
            escaping = true;
        } else if (c === '"') {
            return i;
        }
    }
    return i;
}

/**
 * Assumes the current position is the start of a single-quoted string and returns the position where it ends.
 */
function runSQString (line, start) {
    var i, c, escaping = false;
    for (i = start ; i < line.length ; i++) {
        c = line.charAt(i);
        if (escaping) {
            escaping = false;
        } else if (c === '\\') {
            escaping = true;
        } else if (c === "'") {
            return i;
        }
    }
    return i;
}

/**
 * Returns the position where the current whitespace ends.
 */
function runToWS (line, start) {
    var i, c;
    for (i = start ; i < line.length ; i++) {
        c = line.charAt(i);
        if (/\s/.test(c)) {
            return i;
        }
    }
    return i;
}

/***** *****/

module.exports = Parser;
