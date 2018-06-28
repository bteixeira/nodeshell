/**
 * Keeps track of the position in a string or array. Useful for tokenizers.
 * Provides pointers to two positions in the string: the current position (or "pointer"), and the "mark". This allows
 * keeping track of a position to which you might want to come back later, or process a substring of the string.
 *
 * Because the only state maintained are the two pointers, you can access and change them directly as properties of the
 * object returned by the constructor ("pos" and "mark").
 *
 * As an additional utility, you can stack marker positions. Call pushMark() to save the current mark position, and call
 * popMark() to discard the current mark position and replace it with the last saved one.
 */

import * as utils from './utils';

export type char = string;
export type sequence = string | char[];

export default class Tape {
	private sequence: sequence;
	public pos: number;
	private mark: number;
	private marks: number[];

	constructor(sequence: sequence) {
		this.sequence = sequence;
		this.pos = 0;
		this.mark = 0;
		this.marks = [];
	}

	/* EOF returned when next is called after the end of the sequence. Can be compared for equality. */
	static readonly EOF: char = null;

	/**
	 * Returns the character at current position and moves the pointer one character forward.
	 * @returns {string} the character at the current position
	 */
	next(): char {
		if (!this.hasMore()) {
			return Tape.EOF;
		}
		const c: char = this.peek();
		this.pos = Math.min(this.pos + 1, this.sequence.length);
		return c;
	}

	/**
	 * Returns the character at current position and moves the pointer one character backward.
	 * @returns {string} the character at the current position
	 */
	prev(): char {
		const c: char = this.peek();
		this.pos = Math.max(this.pos - 1, 0);
		return c;
	}

	/**
	 *
	 * Returns the character at current position without changing the pointer.
	 * @returns {string} the character at the current position
	 */
	peek(): char {
		return this.sequence[this.pos];
	}

	/**
	 * Moves the pointer forward until the first character that matches the given pattern.
	 * @param filter string of characters to match. Or RegExp object to use. Or filter function which takes one
	 */
	skipTo(filter): void {
		// TODO TYPEGUARDS
		if (utils.isString(filter)) {
			filter = new RegExp('[' + filter + ']');
		}
		if (!utils.isFunction(filter)) {
			/* Assumed to be regex */
			var re = filter;
			filter = function (item) {
				return re.test(item);
			}
		}
		while (!filter(this.peek()) && this.hasMore()) {
			this.next();
		}
	}

	/**
	 * Moves the pointer forward past all whitespace items.
	 */
	skipWhitespace(): void {
		this.skipTo(/\S/);
	}

	/**
	 * Moves the pointer forward to the next non-whitespace item.
	 */
	skipNonWhitespace(): void {
		this.skipTo(/\s/);
	}

	/**
	 * Sets the mark at the current position.
	 */
	setMark(): void {
		this.mark = this.pos;
	}

	/**
	 * Returns the substring between the mark and the current position. Also works if the mark is ahead ot the current
	 * position.
	 * @returns {string} the substring between the mark and the current position
	 */
	getMarked(): sequence {
		return this.sequence.slice(this.mark, this.pos);
	}

	/**
	 * Whether the pointer is at the end of the string.
	 * @returns {boolean} true if there are still characters ahead of the current position; false if the pointer is at the
	 *      end of the string.
	 */
	hasMore(): boolean {
		return this.pos < this.sequence.length;
	}

	/**
	 * Stores the current mark position in the stack.
	 */
	pushMark(): void {
		this.marks.push(this.mark);
	}

	/**
	 * Discards the current mark position and replaces it with the one at the top of the stack. Returns the discarded mark position.
	 */
	popMark(): number {
		const old = this.mark;
		this.mark = this.marks.pop();
		return old;
	}

	/**
	 * Moves the cursor to the current mark position.
	 */
	rewindToMark(): void {
		this.pos = this.mark;
	}
}
