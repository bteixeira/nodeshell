import * as utils from '../../utils';
import Tape, {char} from '../../tape';
import {Token} from '../commandLineTokenizer';

export const TOKENS = utils.createEnum('DQSTRING', 'NO_DQSTRING', 'UNTERMINATED_DQSTRING', 'UNTERMINATED_ESCAPING_DQSTRING');

export function run (tape: Tape<char>): Token {
	if (tape.peek() !== '"') {
		return {
			type: TOKENS.NO_DQSTRING,
			text: tape.peek(),
			pos: tape.pos,
		};
	}

	tape.pushMark();
	tape.setMark(); // TODO push is always followed by set, isn't it?

	tape.next();

	var c: char;
	var type: symbol;

	while (tape.hasMore()) {
		c = tape.next();
		if (c === '"') {
			type = TOKENS.DQSTRING;
			break;
		} else if (c === '\\') {
			if (!tape.hasMore()) {
				type = TOKENS.UNTERMINATED_ESCAPING_DQSTRING;
				break;
			}
			tape.next();
		}
		if (!tape.hasMore()) {
			type = TOKENS.UNTERMINATED_DQSTRING;
		}
	}

	var text = tape.getMarked();
	var pos = tape.popMark();

	if (text instanceof Array) {
		text = text.join('');
	}

	return {
		type: type,
		text: text as string,
		pos: pos,
	};

}
