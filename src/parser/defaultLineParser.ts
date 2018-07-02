import Tape from '../tape';
import Commands from '../commands';
import commandLineTokenizer from '../tokenizer/commandLineTokenizer';
import DescentParser from './descentParser';
var ast = require('../ast/nodes/descentParserNodes');

export function parseCmdLine (line: string, commands: Commands) {
    const tokens = commandLineTokenizer(line);
	const parser = new DescentParser(commands, new Tape(tokens));
    var ret = parser.COMMAND_LINE();
    if (parser.firstCommand && ret.err) {
        ret.firstCommand = true;
    }
    return ret;
}

export function parseJS (line: string) {
    return ast.JS({text: line, js: line});
}
