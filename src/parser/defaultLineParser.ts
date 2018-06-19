var DescentParser = require('./descentParser');
import {Tape} from '../tape';
var clt = require('../tokenizer/commandLineTokenizer');
var ast = require('../ast/nodes/descentParserNodes');

export function parseCmdLine (line, commands) {
    var parser = new DescentParser(commands);
    parser.tape = new Tape(clt(line));
    parser.firstCommand = true;
    var ret = parser.COMMAND_LINE();
    if (parser.firstCommand && ret.err) {
        ret.firstCommand = true;
    }
    return ret;
}

export function parseJS (line) {
    return ast.JS({text: line, js: line});
}
