var readline = require('readline');

var utils = require('./utils');

var KeyHandler = function (input) {

    var me = this;
    this.input = input;
    readline.emitKeypressEvents(input);

    if (input.isTTY) {
        input.setRawMode(true);
    }
    input.on('keypress', function (ch, key) {
        me.handleKey(ch, key);
    });

//    this._sawReturn = false;

    /* Bindings data structure is an array of 8 elements, each representing a binary combination of the modifier
     keys CTRL, ALT and SHIFT */
    this._bindings = [];
    for (var i = 0; i < 8; i++) {
        this._bindings.push({});
    }

};

function keyToIndex (key) {
    return ((key.ctrl << 1 | key.meta) << 1 | key.shift);
}

var MODIFIERS = 'ctrl meta shift'.split(' ');
var KEYS = 'escape f1 f2 f3 f4 f5 f6 f7 f8 f9 f10 f11 f12 tab backspace enter return insert delete home end pageup pagedown up down left right'.split(' ');
var CONVERSIONS = {
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

KeyHandler.prototype.bind = function (keys, handler) {
    var me = this;
    if (!utils.isArray(keys)) {
        keys = [keys];
    }
    keys.forEach(function (key) {
        key = normalizeKey(key);
        var idx = keyToIndex(key);
        me._bindings[idx][key.name] = handler;
    });
};

KeyHandler.prototype.bindDefault = function (handler) {
    this.defaultHandler = handler;
};

KeyHandler.prototype.handleKey = function (ch, key) {
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

    // Ignore escape key - Fixes #2876
//    if (key.name == 'escape') return;
//
//    if (key.ctrl && key.shift) {
//        /* Control and shift pressed */
//        switch (key.name) {
//            // TODO DOES NOT WORK
////            case 'backspace':
////                this.line.deleteLineLeft();
////                break;
//
//            case 'delete':
//                this.line.deleteLineRight();
//                break;
//        }
//
//    } else if (key.meta) {
//        /* Meta key pressed */
//
//
//    } else {
//        /* No modifier keys used */
//        // \r bookkeeping is only relevant if a \n comes right after.
////        if (this._sawReturn && key.name !== 'enter')
////            this._sawReturn = false;
////
////        switch (key.name) {
////            case 'return':  // carriage return, i.e. \r
////                this._sawReturn = true;
////                this.history.push();
////                this.history.rewind();
////                this.line.accept();
////                break;
////
////            case 'enter':
////                if (this._sawReturn)
////                    this._sawReturn = false;
////                else
////                // TODO can't find a situation in which this occurs, only in mac? check the event generator
////                    this.line.accept();
////                break;
//
//
//            default:
////                if (Buffer.isBuffer(ch))
////                    ch = ch.toString('utf-8');
////
////                if (ch) {
////                    var lines = ch.split(/\r\n|\n|\r/);
////                    for (var i = 0, len = lines.length; i < len; i++) {
////                        if (i > 0) {
////                            this._line();
////                        }
////                        this.line.insert(lines[i]);
////                    }
////                }
//                selfInsert.call(me, ch, key);
//        }
//    }
};

module.exports = KeyHandler;



