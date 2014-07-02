var EventEmitter = require('events').EventEmitter;

var KeyHandler = function (options) {
    this.line = options.line;
    this.history = options.history;
    this.autocompleter = options.autocompleter;
};

KeyHandler.prototype.handleKey = function (ch, key) {
    _ttyWrite.call(this.line, ch, key, this.history, this.autocompleter);
};

module.exports = KeyHandler;


/* Rip off from readline */
var _ttyWrite = function(s, key, history, autocompleter) {

    var me = this;
    function notImplemented () {
        console.log('NO AUTOCOMPLETE IMPLEMENTED YET');
        me._refreshLine();
    }

    key = key || {};

    // Ignore escape key - Fixes #2876
    if (key.name == 'escape') return;

    if (key.ctrl && key.shift) {
        /* Control and shift pressed */
        switch (key.name) {
        case 'backspace':
            this._deleteLineLeft();
            break;

        case 'delete':
            this._deleteLineRight();
            break;
        }

    } else if (key.ctrl) {
        /* Control key pressed */

        switch (key.name) {
        case 'c':
            if (EventEmitter.listenerCount(this, 'SIGINT') > 0) {
                this.emit('SIGINT');
            } else {
                // This readline instance is finished
                this.close();
            }
            break;

        case 'h': // delete left
            this._deleteLeft();
            break;

        case 'd': // delete right or EOF
            if (this.cursor === 0 && this.line.length === 0) {
                // This readline instance is finished
                this.close();
            } else if (this.cursor < this.line.length) {
                this._deleteRight();
            }
            break;

        case 'u': // delete the whole line
            this.cursor = 0;
            this.line = '';
            this._refreshLine();
            break;

        case 'k': // delete from current to end of line
            this._deleteLineRight();
            break;

        case 'a': // go to the start of the line
            this._moveCursor(-Infinity);
            break;

        case 'e': // go to the end of the line
            this._moveCursor(+Infinity);
            break;

        case 'b': // back one character
            this._moveCursor(-1);
            break;

        case 'f': // forward one character
            this._moveCursor(+1);
            break;

        case 'l': // clear the whole screen
            exports.cursorTo(this.output, 0, 0);
            exports.clearScreenDown(this.output);
            this._refreshLine();
            break;

        case 'n': // next history item
            history.next();
            break;

        case 'p': // previous history item
            history.prev();
            break;

        case 'z':
            if (process.platform == 'win32') break;
            if (EventEmitter.listenerCount(this, 'SIGTSTP') > 0) {
                this.emit('SIGTSTP');
            } else {
                process.once('SIGCONT', (function(self) {
                    return function() {
                        // Don't raise events if stream has already been abandoned.
                        if (!self.paused) {
                            // Stream must be paused and resumed after SIGCONT to catch
                            // SIGINT, SIGTSTP, and EOF.
                            self.pause();
                            self.emit('SIGCONT');
                        }
                        // explictly re-enable "raw mode" and move the cursor to
                        // the correct position.
                        // See https://github.com/joyent/node/issues/3295.
                        self._setRawMode(true);
                        self._refreshLine();
                    };
                })(this));
                this._setRawMode(false);
                process.kill(process.pid, 'SIGTSTP');
            }
            break;

        case 'w': // delete backwards to a word boundary
        case 'backspace':
            this.deleteWordLeft();
            break;

        case 'delete': // delete forward to a word boundary
            this._deleteWordRight();
            break;

        case 'left':
            this.moveWordLeft();
            break;

        case 'right':
            this.moveWordRight();
            break;
        }

    } else if (key.meta) {
        /* Meta key pressed */

        switch (key.name) {
        case 'b': // backward word
            this.moveWordLeft();
            break;

        case 'f': // forward word
            this.moveWordRight();
            break;

        case 'd': // delete forward word
        case 'delete':
            this._deleteWordRight();
            break;

        case 'backspace': // delete backwards to a word boundary
            this.deleteWordLeft();
            break;
        }

    } else {
        /* No modifier keys used */
        // \r bookkeeping is only relevant if a \n comes right after.
        if (this._sawReturn && key.name !== 'enter')
            this._sawReturn = false;

        switch (key.name) {
        case 'return':  // carriage return, i.e. \r
            this._sawReturn = true;
//            this._line();
            history.push();
            history.rewind();
            this.accept();
            break;

        case 'enter':
            if (this._sawReturn)
                this._sawReturn = false;
            else
                this._line();
            break;

        case 'backspace':
            this.deleteLeft();
            break;

        case 'delete':
            this.deleteRight();
            break;

        case 'tab': // tab completion
            autocompleter.complete();
            break;

        case 'left':
            this._moveCursor(-1);
            break;

        case 'right':
            this._moveCursor(+1);
            break;

        case 'home':
            this._moveCursor(-Infinity);
            break;

        case 'end':
            this._moveCursor(+Infinity);
            break;

        case 'up':
            history.prev();
            break;

        case 'down':
            history.next();
            break;

        default:
            if (Buffer.isBuffer(s))
                s = s.toString('utf-8');

            if (s) {
                var lines = s.split(/\r\n|\n|\r/);
                for (var i = 0, len = lines.length; i < len; i++) {
                    if (i > 0) {
                        this._line();
                    }
//                    this._insertString(lines[i]);
                    this.insert(lines[i]);
                }
            }
        }
    }
};
