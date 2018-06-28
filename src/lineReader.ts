import WriterPanel from "./panels/tree/writerPanel";
import {EventEmitter} from 'events';

/**
 * LineReader keeps track of user inserted characters and handles the cursor position. Takes an output stream as
 * parameter.
 *
 * Note that this class only holds the state of the currently inserted text. Anything to do with key bindings should be
 * implemented outside, in code which can make use of this class's methods for managing text and cursor.
 *
 * Much of this code was ripped off from NodeJS's own readline module. Although it provides some handy snippets, this
 * code might change in the future. Readline provides way too much functionality that in Nsh should be somewhere else,
 * and that's why we've written this class instead of reusing Readline. Some exported features of Readline are still
 * called from here.
 *
 * @param writer
 * @constructor
 */
export default class LineReader extends EventEmitter {
    writer: WriterPanel;
    prompt: () => string;
    _prompt: string;
    _prompting: any;
    _promptLength: number;
    cursor: number;
    prevRows: number;
    line: any;

	constructor(writer: WriterPanel) {
	    super();
		this.writer = writer;

		this.setLine('').setPrompt(() => '>>> ').updatePrompt();
		this._prompting = false;
	}

	/**
	 * Sets the prompt that will be displayed. Does not refresh the line.
	 * @param prompt
	 */
	setPrompt(prompt: () => string) {
		this.prompt = prompt;
		return this;
	};

	/**
	 * Returns the current two-dimension cursor position starting from the line where the prompt is. This is *not* the
	 * cursor position on the screen.
	 *
	 * EXAMPLE 1:
	 * prompt is "IS IT NOW?", inserted text is "uga bugah", the console has 20 columns and the cursor is at the end -- result is {cols: 19, rows: 0}
	 *
	 * EXAMPLE 2:
	 * same thing, but prompt is "IS\nIT\nNOW?" -- result is {cols: 13, rows: 2}
	 *
	 * @returns {{cols: number, rows: number}}
	 */
	getCursorPos() {

		//var columns = this.output.columns;
		var columns = this.writer.getWidth ? this.writer.getWidth() : this.writer.columns;

		var lines = this._prompt.split(/[\r\n]/);
		var lineCols;
		var lineRows = 0;

		lines.forEach(function (ln) {
			var lnLength = LineReader.countLength(ln);
			lineCols = lnLength % columns;
			lineRows += (lnLength - lineCols) / columns + 1;
		});

		lineRows -= 1;

		var cursorPos = this.cursor + lineCols;
		var cols = cursorPos % columns;
		var rows = (cursorPos - cols) / columns + lineRows;
		return {
			cols: cols,
			rows: rows
		};
	};

	/** TODO get rid of this, line reader does not need to know about accepting lines so move this out of here. That way we
	 * can implement multi-line inputs.
	 */
	accept() {
		var line = this.line;
		this.newLine();
		this.emit('accept', line);
	};

	isEmpty() {
		/* It's probably preferable to check the string length than to use countLength() */
		return this.line.length === 0;
	};

	/**
	 * Inserts text at the current cursor position. Moves the cursor accordingly.
	 * @param str the string to insert
	 */
	insert(str) {
		//BUG: Problem when adding tabs with following content.
		//     Perhaps the bug is in refreshLine(). Not sure.
		//     A hack would be to insert spaces instead of literal '\t'.
		if (this.cursor < this.line.length) {
			var begin = this.line.slice(0, this.cursor);
			var end = this.line.slice(this.cursor, this.line.length);
			this.line = begin + str + end;

			// TODO this should probably be countLength(str) and not str.length, confirm
			this.cursor += str.length;

			this.refreshLine();
		} else {
			this.line += str;
			this.cursor += str.length; // TODO again, this should probably be countLength(str) and not str.length, confirm
			if (this.getCursorPos().cols === 0) {
				this.refreshLine();
			} else {
				//this.output.write(str);
				this.writer.write(str);
			}
			// a hack to get the line refreshed if it's needed
			this.moveCursor(0);
		}
		this.emit('change');
	};

	/**
	 * Move the cursor
	 * @param dx the number of characters to move forward (negative numbers will cause the cursor to move backward)
	 */
	moveCursor(dx) {
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
			//readline.moveCursor(this.output, this.cursor - oldcursor, 0);
			this.writer.moveCursor(this.cursor - oldcursor, 0);
			this.prevRows = newPos.rows;
		} else {
			this.refreshLine();
		}
	};

	moveToEnd() {
		this.moveCursor(+Infinity);
	};

	moveToStart() {
		this.moveCursor(-Infinity);
	};

	moveLeft() {
		this.moveCursor(-1);
	};

	moveRight() {
		this.moveCursor(1);
	};

	/**
	 * Deletes the character to the left of the cursor.
	 */
	deleteLeft() {
		if (this.cursor > 0 && this.line.length > 0) {
			this.line = this.line.slice(0, this.cursor - 1) +
				this.line.slice(this.cursor, this.line.length);

			this.cursor--;
			this.refreshLine();
			this.emit('change');
		}
	};

	/**
	 * Deletes the character to the right of the cursor.
	 */
	deleteRight() {
		this.line = this.line.slice(0, this.cursor) +
			this.line.slice(this.cursor + 1, this.line.length);
		this.refreshLine();
		this.emit('change');
	};

	moveWordLeft() {
		if (this.cursor > 0) {
			var leading = this.line.slice(0, this.cursor);
			var match = leading.match(/([^\w\s]+|\w+|)\s*$/);
			this.moveCursor(-match[0].length);
		}
	};

	moveWordRight() {
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
	deleteWordLeft() {
		if (this.cursor > 0) {
			var leading = this.line.slice(0, this.cursor);
			var match = leading.match(/([^\w\s]+|\w+|)\s*$/);
			leading = leading.slice(0, leading.length - match[0].length);
			this.line = leading + this.line.slice(this.cursor, this.line.length);
			this.cursor = leading.length;
			this.refreshLine();
			this.emit('change');
		}
	};

	/**
	 * Deletes the word to the right of the cursor.
	 */
	deleteWordRight() {
		if (this.cursor < this.line.length) {
			var trailing = this.line.slice(this.cursor);
			var match = trailing.match(/^(\s+|\W+|\w+)\s*/);
			this.line = this.line.slice(0, this.cursor) +
				trailing.slice(match[0].length);
			this.refreshLine();
			this.emit('change');
		}
	};

	/**
	 * Deletes all characters to the left of the cursor.
	 */
	deleteLineLeft() {
		this.line = this.line.slice(this.cursor);
		this.cursor = 0;
		this.refreshLine();
		this.emit('change');
	};

	/**
	 * Deletes all characters to the right of the cursor.
	 */
	deleteLineRight() {
		this.line = this.line.slice(0, this.cursor);
		this.refreshLine();
		this.emit('change');
	};

	/**
	 * Deletes all characters on the line.
	 */
	deleteLine() {
		this.line = '';
		this.cursor = 0;
		this.refreshLine();
		this.emit('change');
	};

	/**
	 * Gets the currently inserted text.
	 * @returns {string}
	 */
	getLine() {
		return this.line;
	};

	/**
	 * Sets the current text. Moves the cursor to the end.
	 * @param line
	 */
	setLine(line) {
		this.line = line;
		this.cursor = line.length;
		this.emit('change');
		return this;
	};

	/**
	 * Takes the line as accepted and moves the cursor down.
	 */
	newLine() {
		this.moveToEnd();
		//this.output.write('\r\n');
		this.writer.write('\r\n');
		this.line = '';
		this.cursor = 0;
		this.prevRows = 0;
		this._prompting = false;
		this.emit('change');
	};

	/**
	 * Go into continuation prompt. Used for multi-line inputs, i.e., when user pressed enter but has not finished the
	 * command or expression
	 */
	startContinuation() {
		// TODO
	};

	/**
	 * Reevaluates the prompt and reprints the prompt and the inserted text.
	 */
	updatePrompt() {

		this._prompt = this.prompt();
		var lines = this._prompt.split(/[\r\n]/);
		var lastLine = lines[lines.length - 1];
		this._promptLength = LineReader.countLength(lastLine);

		return this;
	};

	/**
	 * Reprints the prompt and the currently inserted text. Can also be used to print a new prompt on a new line.
	 */
	refreshLine() {

		if (!this._prompting) {
			this.updatePrompt();
			this._prompting = true;
		}
		//var columns = this.output.columns;
		var columns = this.writer.getWidth ? this.writer.getWidth() : this.writer.columns;

		var line = this._prompt + this.line;
		var lines = line.split(/[\r\n]/);
		var lineCols;
		var lineRows = 0;

		lines.forEach(function (ln) {
			var lnLength = LineReader.countLength(ln);
			lineCols = lnLength % columns;
			lineRows += (lnLength - lineCols) / columns + 1;
		});

		// cursor position
		var cursorPos = this.getCursorPos();

		// first move to the bottom of the current line, based on cursor pos
		var prevRows = this.prevRows || 0;
		if (prevRows > 0) {
			//readline.moveCursor(this.output, 0, -prevRows);
			this.writer.moveCursor(0, -prevRows);
		}

		// Cursor to left edge.
		//readline.cursorTo(this.output, 0); // TODO
		this.writer.cursorTo(0);
		// erase data
		//readline.clearScreenDown(this.output); // TODO
		this.writer.clearScreenDown();

		// Write the prompt and the current buffer content.
		//this.output.write(line);
		this.writer.write(line);

		// Force terminal to allocate a new line
		// TODO NOT DOING THIS BREAKS EMULATION
		//if (lineCols === 0) {
		//this.output.write(' ');
		//this._writer.write(' ');
		//}

		// Move cursor to original position.
		//readline.cursorTo(process.stdout, cursorPos.cols); // TODO
		this.writer.cursorTo(cursorPos.cols + 1);

		var diff = lineRows - cursorPos.rows - 1;
		if (diff > 0) {
			//readline.moveCursor(this.output, 0, -diff);
			this.writer.moveCursor(0, -diff);
		}

		this.prevRows = cursorPos.rows;
	};

	setWriter(writer) {
		this.writer = writer;
	};

	/**
	 * Counts the length of a string skipping escape sequences, such as ones to set the text color of the terminal.
	 * http://en.wikipedia.org/wiki/ANSI_escape_code#Sequence_elements
	 * @param str
	 */
	static countLength(str: string) {
		var ch;
		var length = 0;
		var status = 0; // 0 = normal | 1 = escape char found in the previous loop | 2 = inside multi-char escape sequence
		for (var i = 0; i < str.length; i++) {

			ch = str.charAt(i).charCodeAt(0);

			if (status === 0) {
				if (ch === 27) { // escape char
					status = 1;
				} else {
					length += 1;
				}
			} else if (status === 1) {
				if (ch === 91) { // left bracket, introduces multi-character sequence
					status = 2;
				} else if (ch > 63 && ch < 96) { // valid one-character escape sequence
					status = 0;
				} else { // invalid, I don't know why the escape char is here and I'll assume it's supposed to be printed or something
					length += 2; // count both the escape and the current character
				}
			} else if (status === 2) {
				if (ch > 63 && ch < 127) { // end of sequence
					status = 0;
				} // else nothing. The sequence is not finished yet. I hope it finishes some day.
			}
		}
		return length;
	}
}
