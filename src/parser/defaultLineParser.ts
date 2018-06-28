import Tape from '../tape';
import Commands from '../commands';
import commandLineTokenizer from '../tokenizer/commandLineTokenizer';
var DescentParser = require('./descentParser');
var ast = require('../ast/nodes/descentParserNodes');

export function parseCmdLine (line: string, commands: Commands) {
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
