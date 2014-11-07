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

var utils = require('./utils');

var Tape = module.exports = function (sequence) {
    this.sequence = sequence;
    this.pos = 0;
    this.mark = 0;
    this.marks = [];
};

/**
 * Returns the character at current position and moves the pointer one character forward.
 * @returns {string} the character at the current position
 */
Tape.prototype.next = function () {
    var c = this.peek();
    this.pos = Math.min(this.pos + 1, this.sequence.length);
    return c;
};

/**
 * Returns the character at current position and moves the pointer one character backward.
 * @returns {string} the character at the current position
 */
Tape.prototype.prev = function () {
    var c = this.peek();
    this.pos = Math.max(this.pos - 1, 0);
    return c;
};

/**
 *
 * Returns the character at current position without changing the pointer.
 * @returns {string} the character at the current position
 */
Tape.prototype.peek = function () {
    return this.sequence[this.pos];
};

/**
 * Moves the pointer forward until the first character that matches the given pattern.
 * @param re the pattern to test or. If it is a string, then it is assumed to be the set of characters to match. If it
 *      is a regular expression, then each character is tested against it.
 */
Tape.prototype.skipTo = function (re) {
    if (utils.isString(re)) {
        re = new RegExp('[' + re + ']');
    }
    var c = this.peek();
    while (!re.test(c) && this.pos < this.sequence.length) {
        this.pos += 1;
        c = this.peek();
    }
};

/**
 * Moves the pointer forward past all whitespace characters.
 */
Tape.prototype.skipWS = function () {
    this.skipTo(/\S/);
};

/**
 * Moves the pointer forward to the next non-whitespace character.
 */
Tape.prototype.skipNonWS = function () {
    this.skipTo(/\s/);
};

/**
 * Sets the mark at the current position.
 */
Tape.prototype.setMark = function () {
    this.mark = this.pos;
};

/**
 * Returns the substring between the mark and the current position. Also works if the mark is ahead ot the current
 * position.
 * @returns {string} the substring between the mark and the current position
 */
Tape.prototype.getMarked = function () {
    return this.sequence.slice(this.mark, this.pos);
};

/**
 * Whether the pointer is at the end of the string.
 * @returns {boolean} true if there are still characters ahead of the current position; false if the pointer is at the
 *      end of the string.
 */
Tape.prototype.hasMore = function () {
    return this.pos < this.sequence.length;
};

/**
 * Stores the current mark position in the stack.
 */
Tape.prototype.pushMark = function () {
    this.marks.push(this.mark);
};

/**
 * Discards the current mark position and replaces it with the one at the top of the stack.
 */
Tape.prototype.popMark = function () {
    this.mark = this.marks.pop();
};

/**
 * Moves the cursor to the current mark position.
 */
Tape.prototype.rewindToMark = function () {
    this.pos = this.mark;
};
