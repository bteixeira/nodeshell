import Panel from './panel';

var lastActive;
var oldFooterHeight = 0;
var rl = require('readline');

function saveCursor(stdout) {
	stdout.write('\0o33[s');
}

function restoreCursor(stdout) {
	stdout.write('\0o33[u');
}

/**
 * Iterates a string by character but grouping escape sequences.
 * @param str
 * @param operator callback function with two arguments: takes either a character and false, or an escape sequence and false
 *              callback(seq, isEscape){}
 *                this callback can return a false to break the iteration
 */
function iterateEscapedString(str, operator) {
	var char;
	var code;
	var tmp = '';
	var status = 0; // 0 = normal | 1 = escape char found in the previous loop | 2 = in multi-char escape sequence
	for (var i = 0; i < str.length; i++) {

		char = str.charAt(i);
		code = char.charCodeAt(0);

		if (status === 0) {
			if (code === 27) { // escape char
				status = 1;
				tmp = char;
			} else {
				if (operator(char, false) === false) {
					break;
				}
			}
		} else if (status === 1) {
			if (code === 91) { // left bracket, introduces multi-character sequence
				status = 2;
				tmp += char;
			} else if (code > 63 && code < 96) { // valid one-character escape sequence
				status = 0;
				tmp += char;
				if (operator(tmp, true) === false) {
					break;
				}
			} else { // invalid, I don't know why the escape char is here and I'll assume it's supposed to be printed or something
				if (operator(tmp, true) === false) {
					break;
				}
				if (operator(char, false) === false) {
					break;
				}
				tmp = '';
			}
		} else if (status === 2) {
			tmp += char;
			if (code > 63 && code < 127) { // end of sequence
				status = 0;
				if (operator(tmp, true) === false) {
					break;
				}
			} // else nothing. The sequence is not finished yet. I hope it finishes some day.
		}
	}
}


/**
 * Splits a buffer in two at a desired point. This point will be the calculated width of the first chunk
 * as opposed to the normal length: the "calculated width" is the width a string takes on the screen and not
 * its character count; escape sequences such as the ones to change screen colors might span several characters, but
 * will not take any screen space.
 *
 * @param buf the buffer to split
 * @param width the desired maximum width of the first chunk. In practice, the first chunk might be smaller than this:
 *          if the calculated width of the whole buffer is lower than `width`, then the first chunk will be the whole
 *          buffer, and the remaining chunk will be empty
 * @param target an array into which both chunks will be pushed.
 *
 * returns: the calculated width of the first chunk.
 */
function splitBufferAt(buf, width, target) {
	// TODO!
	// TODO! DO THIS FIRST!

	var at = 0;
	var sum = 0;

	iterateEscapedString(buf, function (seq, isEscape) {
		at += seq.length;
		if (!isEscape) {
			sum += 1;
		}
		if (sum >= width) {
			return false;
		}
	});

	target.push(buf.slice(0, at));
	target.push(buf.slice(at));

	return sum;

}

export default class WriterPanel implements Panel {
	public static active: WriterPanel;
	private redraw: () => void = () => {
	};
	private parent: Panel;
	private row: number = 1;
	private col: number = 1;
	private rows: number = 1;
	private height: number = 1;
	private footer?;
	private content = [];

	public columns: number;

	constructor(private stdout) {
	}

	setFooter(footer_) {
		this.footer = footer_;
	}

	insert(ch, skipChecks) {
		if (ch.charCodeAt(0) === 127) {
			if (this.col > 1) {
				this.stdout.write(ch);
				this.stdout.write(' ');
				this.stdout.write(ch);
				this.col -= 1;
				this.content.splice(this.content.length - 1, 1);
			}
		} else if (ch === '\n' || ch === '\r') { // TODO DIFFERENTIATE THESE TWO
			this.content.push(ch);
			this.insertNewLine(skipChecks);
		} else {
			this.stdout.write(ch);
			if (!skipChecks) {
				this.content.push(ch);
			}
			this.col += 1;
			var width = this.parent.getChildWidth(this);
			if (this.col > width) {
				this.insertNewLine(skipChecks);
			}
		}
	}

	write(str) {
		/*
		var ch;
		var status = 0; // 0 = normal | 1 = escape char found in the previous loop | 2 = in multi-char escape sequence
		var buff = '';
		var active = Writer.active;
		if (active !== this) {
			this.activate();
		}
		for (var i = 0; i < str.length; i++) {

			ch = str.charAt(i).charCodeAt(0);

			if (status === 0) {
				if (ch === 27) { // escape char
					status = 1;
					buff += str.charAt(i);
				} else {
					stdout.write(buff);
					this.insert(str.charAt(i));
					buff = '';
				}
			} else if (status === 1) {
				if (ch === 91) { // left bracket, introduces multi-character sequence
					status = 2;
					buff += str.charAt(i);
				} else if (ch > 63 && ch < 96) { // valid one-character escape sequence
					status = 0;
					buff += str.charAt(i);
					stdout.write(buff);
					buff = '';
				} else { // invalid, I don't know why the escape char is here and I'll assume it's supposed to be printed or something
					this.insert(str.charAt(i));
					buff = '';
				}
			} else if (status === 2) {
				buff += str.charAt(i);
				if (ch > 63 && ch < 127) { // end of sequence
					stdout.write(buff);
					buff = '';
					status = 0;
				} // else nothing. The sequence is not finished yet. I hope it finishes some day.
			}
		}
		if (active !== this) {
			active.activate();
		}
		*/
		//this.superWrite(str);
		//this.superWrite2(str);
		this.superWrite3(str);
	}

	superWrite3(buf) {
		var active = WriterPanel.active;
		if (active !== this) {
			this.activate();
		}

		var tmp = '';
		var len = 0;

		iterateEscapedString(buf, (seq, isEscape) => {
			if (isEscape) {
				//stdout.write(seq);
				tmp += seq;
			} else {
				if (seq.charCodeAt(0) === 127) { //backspace
					//if (col > 1) {
					if (this.col + len > 1) {
						//stdout.write(seq);
						tmp += seq;
						len -= 1;
					}
				} else if (seq === '\n') {
					this.stdout.write(tmp);
					this.col += len;
					tmp = '';
					len = 0;
					this.insertNewLine();
				} else if (seq === '\r') {
					this.stdout.write(tmp);
					this.col += len;
					tmp = '';
					len = 0;
					this.moveCursor(-this.col, 0);
				} else {
					//stdout.write(seq);
					tmp += seq;
					len += seq.length;
					//col += 1;
					//if (col > me.getWidth()) {
					if (this.col + len > this.getWidth()) {
						this.stdout.write(tmp);
						this.col += len;
						tmp = '';
						len = 0;
						this.insertNewLine();
					}
				}
			}
		});

		if (tmp) {
			this.stdout.write(tmp);
			this.col += len;
			tmp = '';
			len = 0;
			if (this.col > this.getWidth()) {
				this.insertNewLine();
			}
		}


		if (active !== this) {
			active.activate();
		}
	}

	superWrite2(buf) {
		var active = WriterPanel.active;
		if (active !== this) {
			this.activate();
		}


		iterateEscapedString(buf, function (seq, isEscape) {
			if (isEscape) {
				this.stdout.write(seq);
			} else {
				if (seq.charCodeAt(0) === 127) { //backspace
					if (this.col > 1) {
						this.stdout.write(seq);
						this.col -= 1;
					}
				} else if (seq === '\n') {
					this.insertNewLine();
				} else if (seq === '\r') {
					this.moveCursor(-this.col, 0);
				} else {
					this.stdout.write(seq);
					this.col += 1;
					if (this.col > this.getWidth()) {
						this.insertNewLine();
					}
				}
			}
		});


		if (active !== this) {
			active.activate();
		}
	}

	// TODO REMOVED METHOD superWrite(buf)

	moveCursor(dx, dy) {
		if (typeof dy === 'undefined') {
			dy = 0;
		}

		var col_ = this.col + dx;
		if (col_ < 1) {
			col_ = 1;
			dx = -this.col + 1;
		} else if (col_ > this.parent.getChildWidth(this)) {
			col_ = this.parent.getChildWidth(this);
			dx = col_ - this.col;
		}
		this.col = col_;

		var row_ = this.row + dy;
		if (row_ < 1) {
			row_ = 1;
			dy = -this.row + 1;
		} else if (row_ > this.getHeight()) {
			row_ = this.getHeight();
			dy = row_ - this.row;
		}
		this.row = row_;

		if (this === WriterPanel.active) {
			rl.moveCursor(this.stdout, dx, dy);
		}
	}

	cursorTo(x, y) {
		if (typeof y === 'undefined') {
			y = this.row;
		}

		if (x > this.getWidth()) {
			x = this.getWidth();
		} else if (x < 1) {
			x = 1;
		}

		if (y > this.getHeight()) {
			y = this.getHeight();
		} else if (y < 1) {
			y = 1;
		}

		if (this === WriterPanel.active) {
			rl.moveCursor(this.stdout, -this.col + x, -this.row + y);
		}
		this.col = x;
		this.row = y;
	}

	rewrite() {
		/*
		var active = Writer.active;
		this.activate();
		this.rewind();
		var me = this;
		row = col = 1;
		content.forEach(function (ch) {
			me.insert(ch, true);
		});
		var width = parent.getChildWidth(this);
		var offsetH = parent.getChildOffsetH(this);
		stdout.write(new Array(width - col + 2).join(' '));
		rl.moveCursor(stdout, -width + col - (
				// if this panel is on the right edge of the screen, the cursor is actually one character behind
				offsetH + width === stdout.columns ? 0 : 1
			), 0);
		active.activate();
		*/
		this.reset();
		this.redraw.call(this);
	}

	rewind() {
		rl.moveCursor(this.stdout, -this.col + 1, -this.row + 1);
	}

	activate() {
		var offsetThis = this.getOffset();
		var diff = 0;
		var active = WriterPanel.active;
		if (!active) {
			// no active panel, this is the first time we're activating
			// cursor starts out at top left most
			rl.moveCursor(this.stdout, offsetThis[1], offsetThis[0]);
		} else if (this.isFooter() && !active.isFooter()) {
			saveCursor(this.stdout);
			lastActive = active;
			rl.cursorTo(this.stdout, offsetThis[1], this.stdout.rows - this.footer.getHeight() + offsetThis[0]);
			if (this.footer) {
				oldFooterHeight = this.footer.getHeight();
			}
		} else {
			if (active.isFooter() && !this.isFooter()) {
				restoreCursor(this.stdout);
				active = lastActive;
				if (this.footer) {
					diff = this.footer.getHeight() - oldFooterHeight;
				}
			}

			var offsetThat = active.getOffset();
			var delta = [offsetThis[0] - offsetThat[0], offsetThis[1] - offsetThat[1]];

			rl.moveCursor(this.stdout, delta[1], delta[0] - diff);

		}
		WriterPanel.active = this;
	}

	getOffset() {
		var offset = this.parent.getChildOffset(this);
		return [offset[0] + this.row - 1, offset[1] + this.col - 1];
	}

	getHeight() {
		return this.height;
	}

	setParent(parent_) {
		this.parent = parent_;
	}

	calculateWidth() {
		this.columns = this.parent.getChildWidth(this);
	}

	isFooter() {
		return this.parent.isFooter(this);
	}

	/**
	 * Assumes the cursor is at the top left of the root layout and repositions it to this panel's cursor position.
	 * TODO this method probably shouldn't exist, this should happen naturally as a side effect of other methods. We're
	 * specifically putting this here for after a command has been executed and the prompt needs to redraw; in that
	 * case, the cursor is actually on the top left, but the active panel still thinks the cursor is where it left it.
	 * Either have a way to signal the active panel that it lost focus or have a general reset method that builds the
	 * whole layout assuming the cursor is at the beginning of input.
	 */
	repositionCursor() {
		var offset = this.getOffset();
		rl.moveCursor(this.stdout, offset[1], offset[0]);
	}

	/**
	 * Resets the buffered content of this panel. Does not clean the screen.
	 */
	reset() {
		this.content = [];
		this.row = this.col = this.height = 1;
	}

	getWidth() {
		return this.parent.getChildWidth(this);
	}

	clearScreenDown() {
		var active = WriterPanel.active;
		if (active !== this) {
			this.activate();
		}

		var oldCol = this.col;
		var oldRow = this.row;
		var width = this.getWidth();

		while (this.row < this.height) {
			this.stdout.write(new Array(width - this.col + 2).join(' '));
			rl.moveCursor(this.stdout, -width, 1);
			this.row += 1;
			this.col = 1;
		}

		// the cursor is on the last line, therefore there must be no character at the last position (otherwise
		// a new line would have been allocated). Therefore do not write until the last character, otherwise a
		// new line will be added as a result of clear screen which doesn't look nice
		//this.write( new Array(this.getWidth() - col + 1).join(' ') );
		this.stdout.write(new Array(width - this.col + 1).join(' '));
		this.col = width;

		this.cursorTo(oldCol, oldRow);

		if (active !== this) {
			active.activate();
		}
	}

	clearScreen() {
		// TODO
		this.cursorTo(1, 1);
		this.clearScreenDown();
	}

	clearLine() {
		// TODO
	}

	clearLineLeft() {
		// TODO
	}

	clearLineRight() {
		// TODO
	}

	setRedraw(redraw_) {
		this.redraw = redraw_;
	}

	private insertNewLine(skipChecks?) {
		var spaceBelow = this.parent.getSpaceBelowChild(this);
		var offsetH = this.parent.getChildOffsetH(this);
		var width = this.parent.getChildWidth(this);
		this.row += 1;
		var oldCol = this.col;
		this.col = 1;
		if (this.row > this.height) {
			this.stdout.write(new Array(spaceBelow + 2).join('\n'));
			rl.moveCursor(this.stdout, offsetH, -spaceBelow);
			this.stdout.write(new Array(width + 1).join(' '));
			rl.moveCursor(this.stdout, -width + (
				// if this panel is on the right edge of the screen, the cursor is actually one character behind
				offsetH + width === this.stdout.columns ? 1 : 0
			), 0);
			this.rows = this.height = this.row;
			this.parent.redrawBelowChild(this);
		} else {
			rl.moveCursor(this.stdout, -oldCol + 1 + (
				// if this panel is on the right edge of the screen, the cursor is actually one character behind
				offsetH + oldCol === this.stdout.columns ? 1 : 0
			), 1);
		}
	}

	getChildOffsetV(child) {
		throw new Error('NOT IMPLEMENTED');
		return -1;
	}

	getChildOffsetH(child) {
		throw new Error('NOT IMPLEMENTED');
		return -1;
	}

	getChildOffset(child): [number, number] {
		throw new Error('NOT IMPLEMENTED');
		return [-1, -1];
	}

	getChildWidth(child) {
		throw new Error('NOT IMPLEMENTED');
		return -1;
	}

	getSpaceBelowChild(child) {
		throw new Error('NOT IMPLEMENTED');
		return -1;
	}

	reserveSpace() {
		throw new Error('NOT IMPLEMENTED');
	}

	redrawBelowChild(child) {
		throw new Error('NOT IMPLEMENTED');
		return -1;
	}
}
