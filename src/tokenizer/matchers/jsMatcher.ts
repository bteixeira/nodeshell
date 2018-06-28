import * as dQStringMatcher from './dqStringMatcher';
import * as utils from '../../utils';
import Tape, {char, sequence} from '../../tape';

export function run(tape: Tape) {
	if (tape.peek() !== '(') {
		return {
			type: tokens.JS_ERROR,
			text: tape.peek(),
			pos: tape.pos
		};
	}

	tape.pushMark();
	tape.setMark(); // TODO PUSH MARK BEFORE CALLING MATCHER

	tape.next();

	var c: char;
	var type: symbol; // TODO TRY TO MAKE TYPE-SAFE
	var pos: number;
	var text: sequence;
	var stack: string[] = [];

	function top() {
		return stack[stack.length - 1];
	}

	while (tape.hasMore()) {
		c = tape.next();
		if (c === ')') {
			if (!stack.length) {
				type = tokens.JSTOKEN;
				break;
			} else if (top() === '(') {
				stack.pop();
			} else {
				type = tokens.JS_ERROR;
				pos = tape.pos - 1;
				text = c;
				break;
			}

		} else if (c === '}') {
			if (top() === '{') {
				stack.pop();
			} else {
				type = tokens.JS_ERROR;
				pos = tape.pos;
				break;
			}
		} else if (c === ']') {
			if (top() === '[') {
				stack.pop();
			} else {
				type = tokens.JS_ERROR;
				pos = tape.pos;
				break;
			}
		} else if (/[\(\[\{]/.test(c)) {
			stack.push(c);
		} else if (c === '"') {
			tape.prev();
			dQStringMatcher.run(tape);
		}
		if (!tape.hasMore()) {
			type = tokens.JS_ERROR;
			pos = tape.pos;
		}
	}

	text = text || tape.getMarked();
	const mark = tape.popMark();
	pos = pos || mark;

	if (text instanceof Array) {
		text = text.join('');
	}

	return {
		type: type,
		text: text,
		pos: pos
	};
}

export const tokens = utils.createEnum('JS_ERROR', 'JSTOKEN');
