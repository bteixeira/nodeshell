import Tape from '../tape';
import CommandSet from '../commandSet';
import commandLineTokenizer from '../tokenizer/commandLineTokenizer';
import DescentParser from './descentParser';
import {DescentParserNode} from '../ast/nodes/descentParserNodes';

import * as ast from '../ast/nodes/descentParserNodes';

export function parseCmdLine (line: string, commands: CommandSet): DescentParserNode {
	const tokens = commandLineTokenizer(line);
	const parser = new DescentParser(commands, new Tape(tokens));
	const node = parser.COMMAND_LINE();
	if (parser.firstCommand && node.err) {
		node.firstCommand = true;
	}
	return node;
}

export function parseJS (line: string): DescentParserNode {
	return ast.JS({type: null, text: line, pos: null});
}
