import * as readline from 'readline';
import {ReadStream} from 'tty';
import {char} from './tape';

const MODIFIERS: string[] = 'ctrl meta shift'.split(' ');
const KEYS: string[] = 'escape f1 f2 f3 f4 f5 f6 f7 f8 f9 f10 f11 f12 tab backspace enter return insert delete home end pageup pagedown up down left right'.split(' ');
const CONVERSIONS: { [key: string]: string } = {
	'esc': 'escape',
	'ret': 'return',
	'ins': 'insert',
	'del': 'delete',
	'alt': 'meta',
	'space': ' ',
};

class KeySpec {
	ctrl: boolean = false;
	shift: boolean = false;
	meta: boolean;
	name?: string;
}

export type handlerFunction = (ch: char, key: KeySpec) => void;
type handlerBucket = { [key: string]: handlerFunction };

export default class KeyHandler {
	private bindings: handlerBucket[];
	input: ReadStream;
	defaultHandler: handlerFunction;

	constructor (input: ReadStream) {
		this.input = input;
		readline.emitKeypressEvents(input);

		if (input.isTTY) {
			input.setRawMode(true);
		}
		input.on('keypress', this.handleKey.bind(this));

		/* Bindings data structure is an array of 8 elements, each representing a binary combination of the modifier
		 keys CTRL, ALT and SHIFT
		 TODO CHECK IF THIS DOC IS ACCURATE
		 */
		this.bindings = [];
		for (var i = 0; i < 8; i++) {
			this.bindings.push({});
		}
	}

	bind (keys: string[], handler: handlerFunction): void {
		keys.forEach(keyCode => {
			const key: KeySpec = normalizeKey(keyCode);
			const idx = keyToIndex(key);
			this.bindings[idx][key.name] = handler;
		});
	}

	bindDefault (handler: handlerFunction): void {
		this.defaultHandler = handler;
	}

	handleKey (ch: char, key: KeySpec = new KeySpec()): void {
		if (!key.name) {
			key.name = ch;
		}
		if (key.name in CONVERSIONS) {
			key.name = CONVERSIONS[key.name];
		}
		const idx = keyToIndex(key);
		var handler: handlerFunction = this.bindings[idx][key.name];
		if (!handler) {
			handler = this.defaultHandler;
		}
		if (handler) {
			handler.call(null, ch, key);
		}
	}
}

/**
 * Calculates the "bucket" for a given key. The bucket is a number index that unequivocally identifies the modifiers of
 * a key. This is used to keep key handlers in a data structure that does not collide based on the key name.
 * @param {KeySpec} key
 * @returns {number}
 */
function keyToIndex (key: KeySpec): number {
	return (
		(Number(key.ctrl) << 1 | Number(key.meta)) << 1 | Number(key.shift)
	);
}

/**
 * @param {string} keyCode description of a key such as "CTRL+A"
 * @returns {KeySpec} the formal key definition
 */
function normalizeKey (keyCode: string): KeySpec {
	const parts: string[] = keyCode.split('+');
	const key = new KeySpec();
	parts.forEach((part: string) => {
		part = part.toLowerCase();

		/* Convert aliases. ESC becomes ESCAPE */
		if (part in CONVERSIONS) {
			part = CONVERSIONS[part];
		}

		if (MODIFIERS.indexOf(part) !== -1) {
			/* Apply modifiers */
			key[part] = true;
		} else if (KEYS.indexOf(part) !== -1 || part.length === 1) {
			/* Assign key name */
			key.name = part;
		} else {
			throw new Error(`Illegal key definition "${key}"`);
		}
	});
	return key;
}
