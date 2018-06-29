import * as utils from '../../utils';
import Tape from '../../tape';
import {Token} from '../commandLineTokenizer';

/**
 * Allowed sequences:
 *      [0-9]*>
 *      [0-9]*>>
 *      [0-9]*>&
 *      [0-9]*<
 *      [0-9]*<>
 *      [0-9]*<&
 */

export function run (tape: Tape): Token {
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
			type = tokens.GTGT;
		} else if (tape.peek() === '&') {
			tape.next();
			type = tokens.GTAMP;
		} else {
			type = tokens.GT;
		}
	} else if (c === '<') {
		if (tape.peek() === '>') {
			tape.next();
			type = tokens.LTGT;
		} else if (tape.peek() === '&') {
			tape.next();
			type = tokens.LTAMP;
		} else {
			type = tokens.LT;
		}
	} else {
		tape.prev();
		type = tokens.NOTREDIR;
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
		text: text,
		pos: pos,
		fd: fd,
	};
}

export const tokens = utils.createEnum('NOTREDIR', 'GT', 'GTGT', 'GTAMP', 'LT', 'LTGT', 'LTAMP');
