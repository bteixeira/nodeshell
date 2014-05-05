var readline = require('readline');
var rl = readline.createInterface(process.stdin, process.stdout);
var vm = require('vm');
var util = require('util');

var getPrompt = function () {
    /* Due to apparent bug in readline, if you want a new line before the prompt
     * you should print it directly. Otherwise when you press backspace an
     * aditional new line will be printed. */
    console.log();
    return process.cwd() + '$ ';
};

rl.setPrompt(getPrompt());
rl.prompt();

rl.on('line', function(line) {
    try {
        var result = runLine(line);
        console.log(result);
    } catch (ex) {
        console.error(ex.toString());
    }
    rl.setPrompt(getPrompt());
    rl.prompt();
}).on('close', function() {
    console.log('\nHave a great day!');
    process.exit(0);
});

function cd (dir) {
    //console.log ('changing to', dir);
    return process.chdir(dir);
}

function stub () {
    console.log('This is simply a stub command.');
    console.log('You gave me these arguments:', arguments);
}

function pwd () {
    console.log(process.cwd());
}

function getCmd (cmd) {
    if (cmd === 'cd') {
        return cd;
    } else if (cmd === 'stub') {
        return stub;
    } else if (cmd === 'pwd') {
        return pwd;
    } else {
        return null;
    }
}

function runLine (line) {
    var match = line.match(/^[a-zA-Z_0-9\-\.]+\s*/);
    var cmd;
    if (match && (cmd = getCmd(match[0].trim()))) {
        // parse rest of line for JS expressions in parentheses, or literals
        var args = findArguments(line, match[0].length);
        // run command with found arguments
        args = args.map(function (val) {
            try {
                console.log('evaling', val);
                return eval(val);
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
        return eval(line);
    }
}

function findArguments (line, start) {
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
