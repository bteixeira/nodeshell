import Tape, {char, sequence} from '../tape';

import * as jsMatcher from './matchers/jsMatcher';
import * as redirMatcher from './matchers/redirMatcher';
import * as dQStringMatcher from './matchers/dqStringMatcher';
import * as chainMatcher from './matchers/chainMatcher';
import * as globMatcher from './matchers/globMatcher';

export interface Token {
	type: symbol | 'COMPLETION'; // TODO COMPLETION SHOULD ALSO BE A SYMBOL
	text: string;
	pos?: number;
	err?: boolean;
	subTokens?: Token[];
	fd?: string; // TODO SPECIFIC TO REDIRECTION
}

export default function (line: sequence<char>): Token[] {
	const tape: Tape<char> = new Tape(line);

	var c: char;
	var tokens: Token[] = [];
	var token: Token;

	while (tape.hasMore()) {
		c = tape.peek();
		if (/^\s$/.test(c)) {
			tape.next();
			continue;
		} else if (c === '"') {
			token = dQStringMatcher.run(tape);

			//continue;
		} else if (c === '(') {
			token = jsMatcher.run(tape);
		} else if (c === '|' || c === '&') {
			token = chainMatcher.run(tape);
		} else if (c === '>' || c === '<' || /^\d$/.test(c)) {
			tape.setMark();
			tape.pushMark();
			token = redirMatcher.run(tape);
			if (token.type === redirMatcher.tokens.NOTREDIR) {
				tape.popMark();
				tape.rewindToMark();
				token = globMatcher.run(tape);
			}
		} else {
			token = globMatcher.run(tape);
		}

		tokens.push(token);
		if (token.type === 'COMPLETION') {
			break
		}
	}

	return tokens;
};