var DescentParser = require('./descentParser');
var Tape = require('../tape');
var clt = require('../tokenizer/commandLineTokenizer');
var ast = require('../ast/nodes/descentParserNodes');

exports.parseCmdLine = function (line, commands) {
    var parser = new DescentParser(commands);
    parser.tape = new Tape(clt(line));
    parser.firstCommand = true;
    var ret = parser.COMMAND_LINE();
    if (parser.firstCommand && ret.err) {
        ret.firstCommand = true;
    }
    return ret;
};

exports.parseJS = function (line) {
    return ast.JS({text: line, js: line});
};