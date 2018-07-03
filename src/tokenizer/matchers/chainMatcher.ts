import * as utils from '../../utils';
import Tape, {char} from '../../tape';
import {Token} from '../commandLineTokenizer';

export const TOKENS = utils.createEnum('AMP', 'PIPE', 'DAMP', 'DPIPE', 'NOT_CHAIN');

// Matches command chainers ('|', '&', '||' or '&&')
export function run (tape: Tape<char>): Token {

	tape.pushMark();
	tape.setMark();

	var c: char = tape.next();
	var type: symbol;

	if (c === '&') {
		if (tape.peek() === '&') {
			tape.next();
			type = TOKENS.DAMP;
		} else {
			type = TOKENS.AMP;
		}
	} else if (c === '|') {
		if (tape.peek() === '|') {
			tape.next();
			type = TOKENS.DPIPE;
		} else {
			type = TOKENS.PIPE;
		}
	} else {
		tape.prev();
		type = TOKENS.NOT_CHAIN;
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
