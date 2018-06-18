import readline = require('readline');

import utils = require('./utils');

class KeyHandler {

	private _bindings: any[];
	input: any;
	defaultHandler: any;

	constructor(input) {

		var me = this;
		this.input = input;
		readline.emitKeypressEvents(input);

		if (input.isTTY) {
			input.setRawMode(true);
		}
		input.on('keypress', function (ch, key) {
			me.handleKey(ch, key);
		});

		/* Bindings data structure is an array of 8 elements, each representing a binary combination of the modifier
		 keys CTRL, ALT and SHIFT */
		this._bindings = [];
		for (var i = 0; i < 8; i++) {
			this._bindings.push({});
		}

	}

	bind(keys, handler) {
		var me = this;
		if (!utils.isArray(keys)) {
			keys = [keys];
		}
		keys.forEach(function (key) {
			key = normalizeKey(key);
			var idx = keyToIndex(key);
			me._bindings[idx][key.name] = handler;
		});
	}

	bindDefault(handler) {
		this.defaultHandler = handler;
	}

	handleKey(ch, key) {
		key = key || {};

		if (!key.name) {
			key.name = ch;
		}
		if (key.name in CONVERSIONS) {
			key.name = CONVERSIONS[key.name];
		}
		MODIFIERS.forEach(function (mod) {
			if (!(mod in key)) {
				key[mod] = false;
			}
		});
		var idx = keyToIndex(key);
		var handler = this._bindings[idx][key.name];
		if (!handler) {
			handler = this.defaultHandler;
		}
		if (handler) {
			handler.call(this, ch, key);
		}

	}
}

function keyToIndex (key) {
    return ((key.ctrl << 1 | key.meta) << 1 | key.shift);
}

const MODIFIERS: string[] = 'ctrl meta shift'.split(' ');
const KEYS: string[] = 'escape f1 f2 f3 f4 f5 f6 f7 f8 f9 f10 f11 f12 tab backspace enter return insert delete home end pageup pagedown up down left right'.split(' ');
const CONVERSIONS = {
    'esc': 'escape',
    'ret': 'return',
    'ins': 'insert',
    'del': 'delete',
    'alt': 'meta',
    'space': ' '
};

function normalizeKey (key) {
    if (utils.isString(key)) {
        var parts = key.split('+');
        key = {ctrl: false, alt: false, shift: false};
        parts.forEach(function (part) {
            part = part.toLowerCase();
            if (part in CONVERSIONS) {
                part = CONVERSIONS[part];
            }
            if (MODIFIERS.indexOf(part) !== -1) {
                key[part] = true;
            } else if (KEYS.indexOf(part) !== -1 || part.length === 1) {
                key.name = part;
            }
            else {
                throw 'Illegal key definition (' + key + ')';
            }
        });
        return key;
    }
    return key;
}

module.exports = KeyHandler;



