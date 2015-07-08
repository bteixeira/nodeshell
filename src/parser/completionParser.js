var DescentParser = require('./descentParser');
var Tape = require('../tape');
var clt = require('../tokenizer/commandLineTokenizer');
var ast = require('../ast/nodes/descentParserNodes');
var CompletionToken = require('./completionToken');

exports.parseCmdLine = function (line, commands) {
    var parser = new DescentParser(commands);

    var tokens = clt(line);
    var last = tokens[tokens.length - 1];
    tokens[tokens.length - 1] = new CompletionToken(last);

//    console.log('\n', tokens);

    parser.tape = new Tape(tokens);
    parser.firstCommand = true;
    var ret = parser.COMMAND_LINE();

    console.log(ret);

    // TODO
        // check if returned is completion
            // if so, check completion type
                // if command name, check possible commands for prefix
                // if command argument, check completion config including default, filtered by prefix
                // otherwise, show error while completing
            // if not, show syntax error
        // if list of completions
            // if empty, show message
            // if only one entry, assume it
            // if more than one
                // start with common:=first
                // for each one after first
                    // check if it is prefix of common, remove last character until it is


//    if (parser.firstCommand && ret.err) {
//        ret.firstCommand = true;
//    }
//    return ret;
};

//exports.parseJS = function (line) {
//    return ast.JS({text: line, js: line});
//};
