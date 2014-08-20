var EventEmitter = require('events').EventEmitter;

var KeyHandler = function (options) {
    this.line = options.line;
    this.history = options.history;
    this.autocompleter = options.autocompleter;
    this._sawReturn = false;
};

/* Rip off from readline's _ttyWrite */
KeyHandler.prototype.handleKey = function (ch, key) {
    key = key || {};

    // Ignore escape key - Fixes #2876
    if (key.name == 'escape') return;

    if (key.ctrl && key.shift) {
        /* Control and shift pressed */
        switch (key.name) {
            case 'backspace':
                this.line.deleteLineLeft();
                break;

            case 'delete':
                this.line.deleteLineRight();
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
                this.line.deleteLeft();
                break;

            case 'd': // delete right or EOF
                if (this.cursor === 0 && this.line.length === 0) {
                    // This readline instance is finished
                    this.close();
                } else if (this.cursor < this.line.length) {
                    this.line.deleteRight();
                }
                break;

            case 'u': // delete the whole line
                this.line.deleteLine();
                break;

            case 'k': // delete from current to end of line
                this.line.deleteLineRight();
                break;

            case 'a': // go to the start of the line
                this.line.moveToStart();
                break;

            case 'e': // go to the end of the line
                this.line.moveToEnd();
                break;

            case 'b': // back one character
                this.line.moveLeft();
                break;

            case 'f': // forward one character
                this.line.moveRight();
                break;

            case 'l': // clear the whole screen
                exports.cursorTo(this.output, 0, 0);
                exports.clearScreenDown(this.output);
                this.line.refreshLine();
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
                    process.once('SIGCONT', (function (self) {
                        return function () {
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
                            self.line.refreshLine();
                        };
                    })(this));
                    this._setRawMode(false);
                    process.kill(process.pid, 'SIGTSTP');
                }
                break;

            case 'w': // delete backwards to a word boundary
            case 'backspace':
                this.line.deleteWordLeft();
                break;

            case 'delete': // delete forward to a word boundary
                this.line.deleteWordRight();
                break;

            case 'left':
                this.line.moveWordLeft();
                break;

            case 'right':
                this.line.moveWordRight();
                break;
        }

    } else if (key.meta) {
        /* Meta key pressed */

        switch (key.name) {
            case 'b': // backward word
                this.line.moveWordLeft();
                break;

            case 'f': // forward word
                this.line.moveWordRight();
                break;

            case 'd': // delete forward word
            case 'delete':
                this.line.deleteWordRight();
                break;

            case 'backspace': // delete backwards to a word boundary
                this.line.deleteWordLeft();
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
                this.history.push();
                this.history.rewind();
                this.line.accept();
                break;

            case 'enter':
                if (this._sawReturn)
                    this._sawReturn = false;
                else
                // TODO can't find a situation in which this occurs, only in mac? check the event generator
                    this.line.accept();
                break;

            case 'backspace':
                this.line.deleteLeft();
                break;

            case 'delete':
                this.line.deleteRight();
                break;

            case 'tab': // tab completion
                this.autocompleter.complete();
                break;

            case 'left':
                this.line.moveLeft();
                break;

            case 'right':
                this.line.moveRight();
                break;

            case 'home':
                this.line.moveCursor(-Infinity);
                break;

            case 'end':
                this.line.moveCursor(+Infinity);
                break;

            case 'up':
                this.history.prev();
                break;

            case 'down':
                this.history.next();
                break;

            default:
                if (Buffer.isBuffer(ch))
                    ch = ch.toString('utf-8');

                if (ch) {
                    var lines = ch.split(/\r\n|\n|\r/);
                    for (var i = 0, len = lines.length; i < len; i++) {
                        if (i > 0) {
                            this._line();
                        }
                        this.line.insert(lines[i]);
                    }
                }
        }
    }
};

module.exports = KeyHandler;



