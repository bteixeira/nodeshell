var DescentParser = require('./descentParser');
import {Tape} from '../tape';
import commandLineTokenizer from '../tokenizer/commandLineTokenizer';
var ast = require('../ast/nodes/descentParserNodes');

export function parseCmdLine (line: string, commands) {
    const parser = new DescentParser(commands);
    const tokens = commandLineTokenizer(line);
    parser.tape = new Tape(tokens);
    parser.firstCommand = true;
    var ret = parser.COMMAND_LINE();
    if (parser.firstCommand && ret.err) {
        ret.firstCommand = true;
    }
    return ret;
}

export function parseJS (line: string) {
    return ast.JS({text: line, js: line});
}
