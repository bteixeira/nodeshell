// Matches command chainers ('|', '&', '||' or '&&')

import * as utils from '../../utils';
import Tape, {char} from '../../tape';

export function run (tape: Tape) {

	tape.pushMark();
	tape.setMark();

	var c: char = tape.next();
	var type: symbol;

	if (c === '&') {
		if (tape.peek() === '&') {
			tape.next();
			type = tokens.DAMP;
		} else {
			type = tokens.AMP;
		}
	} else if (c === '|') {
		if (tape.peek() === '|') {
			tape.next();
			type = tokens.DPIPE;
		} else {
			type = tokens.PIPE;
		}
	} else {
		tape.prev();
		type = tokens.NOT_CHAIN;
	}

	var text = tape.getMarked();
	var pos = tape.popMark();

	if (text instanceof Array) {
		text = text.join('');
	}

	return {
		type: type,
		text: text,
		pos: pos,
	};

}

export const tokens = utils.createEnum('AMP', 'PIPE', 'DAMP', 'DPIPE', 'NOT_CHAIN');
