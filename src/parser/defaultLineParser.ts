import Tape from '../tape';
import Commands from '../commands';
import commandLineTokenizer from '../tokenizer/commandLineTokenizer';
import DescentParser from './descentParser';
import {DescentParserNode} from '../ast/nodes/descentParserNodes';

import * as ast from '../ast/nodes/descentParserNodes';

export function parseCmdLine (line: string, commands: Commands): DescentParserNode {
	const tokens = commandLineTokenizer(line);
	const parser = new DescentParser(commands, new Tape(tokens));
	var ret = parser.COMMAND_LINE();
	if (parser.firstCommand && ret.err) {
		ret.firstCommand = true;
	}
	return ret;
}

export function parseJS (line: string): DescentParserNode {
	return ast.JS({type: null, text: line, pos: null});
}
