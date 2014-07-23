var readline = require('readline');

var Line = function Line(options) {
    // TODO make some of these private
    this.output = options.output;
    this.acceptCB = options.acceptCB;
    this.line = '';
    this.cursor = 0;

    this._prompt = '>>> ';
    this._promptLength = 4;
    this.terminal = true;
    this._sawReturn = false;

    /**/

};

Line.prototype.setPrompt = function (prompt) {
    this._prompt = prompt;
    this._promptLength = prompt.length;
//    this._refreshLine();
};

Line.prototype.accept = function () {
    var line = this.line;
    this.clearLine();
    this.acceptCB.call(this, line);
};

Line.prototype.insert = function (str/*, pos*/) {
    var c = str;
    //BUG: Problem when adding tabs with following content.
    //     Perhaps the bug is in _refreshLine(). Not sure.
    //     A hack would be to insert spaces instead of literal '\t'.
    if (this.cursor < this.line.length) {
        var beg = this.line.slice(0, this.cursor);
        var end = this.line.slice(this.cursor, this.line.length);
        this.line = beg + c + end;
        this.cursor += c.length;
        this._refreshLine();
    } else {
        this.line += c;
        this.cursor += c.length;
        if (this._getCursorPos().cols === 0) {
            this._refreshLine();
        } else {
            this.output.write(c);
        }
        // a hack to get the line refreshed if it's needed
        this._moveCursor(0);
    }
};

Line.prototype.moveLeft = function () {
};

Line.prototype.moveWordLeft = function () {
    if (this.cursor > 0) {
        var leading = this.line.slice(0, this.cursor);
        var match = leading.match(/([^\w\s]+|\w+|)\s*$/);
        this._moveCursor(-match[0].length);
    }
};

Line.prototype.moveRight = function () {
};

Line.prototype.moveWordRight = function () {
    if (this.cursor < this.line.length) {
        var trailing = this.line.slice(this.cursor);
        var match = trailing.match(/^(\s+|\W+|\w+)\s*/);
        this._moveCursor(match[0].length);
    }
};

Line.prototype._moveCursor = function (dx) {
    var oldcursor = this.cursor;
    var oldPos = this._getCursorPos();
    this.cursor += dx;

    // bounds check
    if (this.cursor < 0) {
        this.cursor = 0;
    }
    if (this.cursor > this.line.length) {
        this.cursor = this.line.length;
    }

    var newPos = this._getCursorPos();

    // check if cursors are in the same line
    if (oldPos.rows === newPos.rows) {
        readline.moveCursor(this.output, this.cursor - oldcursor, 0);
        this.prevRows = newPos.rows;
    } else {
        this._refreshLine();
    }
};

Line.prototype.deleteLeft = function () {
    if (this.cursor > 0 && this.line.length > 0) {
        this.line = this.line.slice(0, this.cursor - 1) +
            this.line.slice(this.cursor, this.line.length);

        this.cursor--;
        this._refreshLine();
    }
};

Line.prototype.deleteRight = function () {
    this.line = this.line.slice(0, this.cursor) +
        this.line.slice(this.cursor + 1, this.line.length);
    this._refreshLine();
};

Line.prototype.deleteWordLeft = function () {
    if (this.cursor > 0) {
        var leading = this.line.slice(0, this.cursor);
        var match = leading.match(/([^\w\s]+|\w+|)\s*$/);
        leading = leading.slice(0, leading.length - match[0].length);
        this.line = leading + this.line.slice(this.cursor, this.line.length);
        this.cursor = leading.length;
        this._refreshLine();
    }
};

Line.prototype.deleteWordRight = function () {
};

Line.prototype.deleteLineLeft = function () {
};

Line.prototype.deleteLineRight = function () {
};

Line.prototype.deleteLine = function () {
    this.line = '';
    this.cursor = 0;
    this._refreshLine();
};

Line.prototype.getLine = function () {
    return this.line;
};

Line.prototype.setLine = function (line) {
    this.line = line;
    this.cursor = line.length;
    this._refreshLine();
};

Line.prototype.clearLine = function () {
    this._moveCursor(+Infinity);
    this.output.write('\r\n');
    this.line = '';
    this.cursor = 0;
    this.prevRows = 0;
};

module.exports = Line;

Line.prototype._refreshLine = function () {
    var columns = this.columns;

    // line length
    var line = this._prompt + this.line;
    var lineLength = line.length;
    var lineCols = lineLength % columns;
    var lineRows = (lineLength - lineCols) / columns;

    // cursor position
    var cursorPos = this._getCursorPos();

    // first move to the bottom of the current line, based on cursor pos
    var prevRows = this.prevRows || 0;
    if (prevRows > 0) {
        exports.moveCursor(this.output, 0, -prevRows);
    }

    // Cursor to left edge.
    exports.cursorTo(this.output, 0);
    // erase data
    exports.clearScreenDown(this.output);

    // Write the prompt and the current buffer content.
    this.output.write(line);

    // Force terminal to allocate a new line
    if (lineCols === 0) {
        this.output.write(' ');
    }

    // Move cursor to original position.
    exports.cursorTo(this.output, cursorPos.cols);

    var diff = lineRows - cursorPos.rows;
    if (diff > 0) {
        exports.moveCursor(this.output, 0, -diff);
    }

    this.prevRows = cursorPos.rows;
};
Line.prototype._getCursorPos = function () {
    var columns = this.output.columns;
    var cursorPos = this.cursor + this._promptLength;
    var cols = cursorPos % columns;
    var rows = (cursorPos - cols) / columns;
    return {cols: cols, rows: rows};
};
function cursorTo(stream, x, y) {
    if (typeof x !== 'number' && typeof y !== 'number') {
        return;
    }

    if (typeof x !== 'number') {
        throw new Error("Can't set cursor row without also setting it's column");
    }

    if (typeof y !== 'number') {
        stream.write('\x1b[' + (x + 1) + 'G');
    } else {
        stream.write('\x1b[' + (y + 1) + ';' + (x + 1) + 'H');
    }
}
exports.cursorTo = cursorTo;
function clearScreenDown(stream) {
    stream.write('\x1b[0J');
}
exports.clearScreenDown = clearScreenDown;
