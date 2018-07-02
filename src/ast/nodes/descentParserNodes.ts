import {Token} from '../../tokenizer/commandLineTokenizer';

export interface DescentParserNode {
	type: string;

	direction?: Token;
	target?: Token;
	fd?: string;
	redirs?: DescentParserNode[];
	cmd?: string;
	args?: DescentParserNode[];
	left?: string;
	right?: string;
	glob?: Token;
	token?: Token;
	err?: boolean;
	pos?: number;
	expected?: any; // TODO ANY
	'completion-type'?: string;
	prefix?: string;
	node?: DescentParserNode;

	firstCommand?: boolean;
}

export function REDIR (direction: Token, target: Token, fd?): DescentParserNode {
	return {
		type: 'REDIR',
		direction: direction,
		target: target,
		fd: fd,
	};
}

export function COMMAND (cmd: string, args: DescentParserNode[], redirs: DescentParserNode[]): DescentParserNode {
	return {
		type: 'COMMAND',
		cmd: cmd,
		args: args,
		redirs: redirs,
	};
}

export function PIPELINE (left, right): DescentParserNode {
	return {
		type: 'PIPELINE',
		left: left,
		right: right,
	};
}

export function AND_LIST (left, right): DescentParserNode {
	return {
		type: 'AND_LIST',
		left: left,
		right: right,
	};
}

export function OR_LIST (left, right): DescentParserNode {
	return {
		type: 'OR_LIST',
		left: left,
		right: right,
	};
}

export function SEQUENCE (left, right?): DescentParserNode {
	return {
		type: 'SEQUENCE',
		left: left,
		right: right,
	};
}

export function GLOB (glob): DescentParserNode {
	return {
		type: 'GLOB',
		glob: glob,
	};
}

export function JS (js): DescentParserNode {
	return {
		type: 'JS',
		token: js,
	};
}

export function DQSTRING (dqstring): DescentParserNode {
	return {
		type: 'DQSTRING',
		token: dqstring,
	};
}
