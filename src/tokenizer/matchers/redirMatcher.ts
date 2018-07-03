import * as utils from '../../utils';
import Tape, {char} from '../../tape';
import {Token} from '../commandLineTokenizer';

export const TOKENS = utils.createEnum('NOTREDIR', 'GT', 'GTGT', 'GTAMP', 'LT', 'LTGT', 'LTAMP');

/**
 * Allowed sequences:
 *      [0-9]*>
 *      [0-9]*>>
 *      [0-9]*>&
 *      [0-9]*<
 *      [0-9]*<>
 *      [0-9]*<&
 */
export function run (tape: Tape<char>): Token {
	tape.pushMark();
	tape.setMark();

	var c = tape.next();
	var type, fd;

	if (/\d/.test(c)) {
		while (/\d/.test(tape.peek())) {
			tape.next();
		}
		fd = tape.getMarked();
		c = tape.next();
	}

	if (c === '>') {
		if (tape.peek() === '>') {
			tape.next();
			type = TOKENS.GTGT;
		} else if (tape.peek() === '&') {
			tape.next();
			type = TOKENS.GTAMP;
		} else {
			type = TOKENS.GT;
		}
	} else if (c === '<') {
		if (tape.peek() === '>') {
			tape.next();
			type = TOKENS.LTGT;
		} else if (tape.peek() === '&') {
			tape.next();
			type = TOKENS.LTAMP;
		} else {
			type = TOKENS.LT;
		}
	} else {
		tape.prev();
		type = TOKENS.NOTREDIR;
	}

	var text = tape.getMarked();
	var pos = tape.popMark();

	if (text instanceof Array) {
		text = text.join('');
	}
	if (fd instanceof Array) {
		fd = fd.join('');
	}

	return {
		type: type,
		text: text as string,
		pos: pos,
		fd: fd,
	};
}
