var readline = require('readline');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var LineReader = function LineReader(output) {
    this.output = output;

    this.line = '';
    this.cursor = 0;

    // TODO make some of these private
    this._prompt = '>>> ';
    this._promptLength = 4;
    this._sawReturn = false;

    /**/

};

util.inherits(LineReader, EventEmitter);

/**
 * Sets the prompt that will be displayed on next line refresh. Does not refresh the line.
 * @param prompt
 */
LineReader.prototype.setPrompt = function (prompt) {
    this._prompt = prompt;
    this._promptLength = prompt.length;
};

/** TODO get rid of this, line reader does not need to know about accepting lines so move this out of here. That way we
 * can implement multi-line inputs.
 */
LineReader.prototype.accept = function () {
    var line = this.line;
    this.newLine();
    this.emit('accept', line);
};

LineReader.prototype.insert = function (str/*, pos*/) {
    //BUG: Problem when adding tabs with following content.
    //     Perhaps the bug is in refreshLine(). Not sure.
    //     A hack would be to insert spaces instead of literal '\t'.
    if (this.cursor < this.line.length) {
        var begin = this.line.slice(0, this.cursor);
        var end = this.line.slice(this.cursor, this.line.length);
        this.line = begin + str + end;
        this.cursor += str.length;
        this.refreshLine();
    } else {
        this.line += str;
        this.cursor += str.length;
        if (this.getCursorPos().cols === 0) {
            this.refreshLine();
        } else {
            this.output.write(str);
        }
        // a hack to get the line refreshed if it's needed
        this.moveCursor(0);
    }
};

/**
 * Move the cursor
 * @param dx the number of characters to move
 */
LineReader.prototype.moveCursor = function (dx) {
    var oldcursor = this.cursor;
    var oldPos = this.getCursorPos();
    this.cursor += dx;

    // bounds check
    if (this.cursor < 0) {
        this.cursor = 0;
    }
    if (this.cursor > this.line.length) {
        this.cursor = this.line.length;
    }

    var newPos = this.getCursorPos();

    // check if cursors are in the same line
    if (oldPos.rows === newPos.rows) {
        readline.moveCursor(this.output, this.cursor - oldcursor, 0);
        this.prevRows = newPos.rows;
    } else {
        this.refreshLine();
    }
};

LineReader.prototype.moveToEnd = function () {
    this.moveCursor(+Infinity);
};

LineReader.prototype.moveToStart = function () {
    this.moveCursor(-1);
};

LineReader.prototype.moveLeft = function () {
    this.moveCursor(-1);
};

LineReader.prototype.moveRight = function () {
    this.moveCursor(1);
};

/**
 * Deletes the character to the left of the cursor.
 */
LineReader.prototype.deleteLeft = function () {
    if (this.cursor > 0 && this.line.length > 0) {
        this.line = this.line.slice(0, this.cursor - 1) +
            this.line.slice(this.cursor, this.line.length);

        this.cursor--;
        this.refreshLine();
    }
};

/**
 * Deletes the character to the right of the cursor.
 */
LineReader.prototype.deleteRight = function () {
    this.line = this.line.slice(0, this.cursor) +
        this.line.slice(this.cursor + 1, this.line.length);
    this.refreshLine();
};

LineReader.prototype.moveWordLeft = function () {
    if (this.cursor > 0) {
        var leading = this.line.slice(0, this.cursor);
        var match = leading.match(/([^\w\s]+|\w+|)\s*$/);
        this.moveCursor(-match[0].length);
    }
};

LineReader.prototype.moveWordRight = function () {
    if (this.cursor < this.line.length) {
        var trailing = this.line.slice(this.cursor);
        var match = trailing.match(/^(\s+|\W+|\w+)\s*/);
        this.moveCursor(match[0].length);
    }
};


// TODO RULES FOR WORD BOUNDARIES AND HOW MUCH TO DELETE ARE NOT CONSISTENT AND GENERALLY SUCK. IMPROVE THIS (still using node's code)
/**
 * Deletes the word to the left of the cursor.
 */
LineReader.prototype.deleteWordLeft = function () {
    if (this.cursor > 0) {
        var leading = this.line.slice(0, this.cursor);
        var match = leading.match(/([^\w\s]+|\w+|)\s*$/);
        leading = leading.slice(0, leading.length - match[0].length);
        this.line = leading + this.line.slice(this.cursor, this.line.length);
        this.cursor = leading.length;
        this.refreshLine();
    }
};

/**
 * Deletes the word to the right of the cursor.
 */
LineReader.prototype.deleteWordRight = function () {
    if (this.cursor < this.line.length) {
        var trailing = this.line.slice(this.cursor);
        var match = trailing.match(/^(\s+|\W+|\w+)\s*/);
        this.line = this.line.slice(0, this.cursor) +
            trailing.slice(match[0].length);
        this.refreshLine();
    }
};

/**
 * Deletes all characters to the left of the cursor.
 */
LineReader.prototype.deleteLineLeft = function () {
};

/**
 * Deletes all characters to the right of the cursor.
 */
LineReader.prototype.deleteLineRight = function () {
};

/**
 * Deletes all characters on the line.
 */
LineReader.prototype.deleteLine = function () {
    this.line = '';
    this.cursor = 0;
    this.refreshLine();
};

/**
 * Gets the currently inserted text.
 * @returns {string}
 */
LineReader.prototype.getLine = function () {
    return this.line;
};

/**
 * Sets the current text. Moves the cursor to the end.
 * @param line
 */
LineReader.prototype.setLine = function (line) {
    this.line = line;
    this.cursor = line.length;
    this.refreshLine();
};

/**
 * Takes the line as accepted and prints a new prompt.
 */
LineReader.prototype.newLine = function () {
    this.moveToEnd();
    this.output.write('\r\n');
    this.line = '';
    this.cursor = 0;
    this.prevRows = 0;
};

/**
 * Go into continuation prompt. Used for multi-line inputs, i.e., when user pressed enter but has not finished the
 * command or expression
 */
LineReader.prototype.startContinuation = function () {
    // TODO
};

/**
 * Reprints the prompt and the currently inserted text.
 */
LineReader.prototype.refreshLine = function () {
    var columns = this.columns;

    // line length
    var line = this._prompt + this.line;
    var lineLength = line.length;
    var lineCols = lineLength % columns;
    var lineRows = (lineLength - lineCols) / columns;

    // cursor position
    var cursorPos = this.getCursorPos();

    // first move to the bottom of the current line, based on cursor pos
    var prevRows = this.prevRows || 0;
    if (prevRows > 0) {
        exports.moveCursor(this.output, 0, -prevRows);
    }

    // Cursor to left edge.
    readline.cursorTo(this.output, 0);
    // erase data
    readline.clearScreenDown(this.output);

    // Write the prompt and the current buffer content.
    this.output.write(line);

    // Force terminal to allocate a new line
    if (lineCols === 0) {
        this.output.write(' ');
    }

    // Move cursor to original position.
    readline.cursorTo(this.output, cursorPos.cols);

    var diff = lineRows - cursorPos.rows;
    if (diff > 0) {
        exports.moveCursor(this.output, 0, -diff);
    }

    this.prevRows = cursorPos.rows;
};

/**
 * Returns the current two-dimension cursor position starting from the line where the prompt is. This is *not* the
 * cursor position on the screen.
 *
 * @returns {{cols: number, rows: number}}
 */
LineReader.prototype.getCursorPos = function () {
    var columns = this.output.columns;
    var cursorPos = this.cursor + this._promptLength;
    var cols = cursorPos % columns;
    var rows = (cursorPos - cols) / columns;
    return {
        cols: cols,
        rows: rows
    };
};

module.exports = LineReader;
