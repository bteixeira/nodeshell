import * as path from 'path';
import * as utils from '../../utils';
import {Token} from '../commandLineTokenizer';
import * as completionParser from '../../parser/completionParser';
import {char, sequence, default as Tape} from '../../tape';

const ESCAPABLES = {
	'0': '\0',
	'n': '\n',
	'r': '\r',
	'v': '\v',
	't': '\t',
	'b': '\b',
	'f': '\f',
};

const BREAKERS = utils.strToObj('&|<>("');
const SPECIALS = utils.createEnum('*', '?');

export const TOKENS = utils.createEnum('GLOB', 'NO_GLOB', 'UNTERMINATED_ESCAPE');
export const SUBTOKENS = utils.createEnum('TEXT', 'STAR', 'QUESTION', 'SEPARATOR');

function matchText (tape: Tape<char>): Token {
	tape.pushMark();
	tape.setMark();

	var c = tape.peek();

	while (!(c in BREAKERS) && !/^\s$/.test(c) && !(c in SPECIALS) && c !== '\\' && tape.hasMore() && c !== completionParser.COMPLETION) {
		tape.next();
		c = tape.peek();
	}

	var text = tape.getMarked();
	if (text instanceof Array) {
		text = text.join('');
	}
	tape.popMark();
	return {
		type: SUBTOKENS.TEXT,
		text: text as string,
		pos: -1, // TODO
	};
}

function matchSpecial (tape: Tape<char>): Token {
	var c = tape.next();
	var type;
	if (c === '*') {
		type = SUBTOKENS.STAR;
	} else if (c === '?') {
		type = SUBTOKENS.QUESTION;
	}
	return {
		type: type,
		text: c,
		pos: -1, // TODO
	};
}

function matchEscape (tape: Tape<char>): Token {
	var c = tape.next();
	if (c !== '\\') {
		return {
			type: null,
			text: c,
			err: true,
			pos: -1, // TODO
		};
	}

	if (!tape.hasMore()) {
		return {
			type: TOKENS.UNTERMINATED_ESCAPE,
			text: c,
			pos: tape.pos,
			err: true,
		}
	}

	c = tape.next();
	if (c in ESCAPABLES) {
		c = ESCAPABLES[c];
	}

	return {
		type: SUBTOKENS.TEXT,
		text: c,
		pos: tape.pos,
	};
}

export function run (tape: Tape<char>): Token {

	tape.pushMark();
	tape.setMark();

	var c = tape.peek();
	if (!tape.hasMore() || c in BREAKERS || /^\s$/.test(c)) {
		return {
			type: TOKENS.NO_GLOB,
			pos: tape.popMark(),
			text: c,
		};
	}

	var subTokens: Token[] = [];
	var subToken;
	var text: sequence<char>;
	var type: symbol;
	do {
		if (c === completionParser.COMPLETION) {
			type = completionParser.COMPLETION_TYPE; // TODO TODO TODO
			break;
		} else if (c in BREAKERS || /\s/.test(c)) {
			break;
		} else if (c in SPECIALS) {
			subTokens.push(matchSpecial(tape));
		} else if (c === '\\') {
			subToken = matchEscape(tape);
			if (subToken.err) {
				tape.rewindToMark();
				tape.popMark();
				return subToken;
			}
			subTokens.push(subToken);
		} else if (c === path.sep) {
			tape.next();
			subTokens.push({
				type: SUBTOKENS.SEPARATOR,
				text: c,
				pos: tape.popMark(),
			});
		} else {
			subTokens.push(matchText(tape));
		}
		c = tape.peek();
	} while (tape.hasMore());

	text = tape.getMarked();
	if (text instanceof Array) {
		text = text.join('');
	}

	tape.popMark();
	return {
		type: type || TOKENS.GLOB,
		pos: tape.getMark(),
		text: text as string,
		subTokens: subTokens,
	}
}
