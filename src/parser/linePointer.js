/**
 * Keeps track of the position in a string. Useful for tokenizers.
 * Provides pointers to two positions in the string: the current position (or "pointer"), and the "mark". This allows
 * keeping rack of a position to which you might want to come back later, or process a substring of the string.
 */

var utils = require('../utils');

var Pointer = module.exports = function (line) {
    this.line = line;
    this.pos = 0;
    this.mark = 0;
};

/**
 * Returns the character at current position and moves the pointer one character forward.
 * @returns {string} the character at the current position
 */
Pointer.prototype.next = function () {
    var c = this.peek();
    this.pos = Math.min(this.pos + 1, this.line.length);
    return c;
};

/**
 * Returns the character at current position and moves the pointer one character backward.
 * @returns {string} the character at the current position
 */
Pointer.prototype.prev = function () {
    var c = this.peek();
    this.pos = Math.max(this.pos - 1, 0);
    return c;
};

/**
 *
 * Returns the character at current position without changing the pointer.
 * @returns {string} the character at the current position
 */
Pointer.prototype.peek = function () {
    return this.line.charAt(this.pos);
};

/**
 * Moves the pointer forward until the first character that matches the given pattern.
 * @param re the pattern to test or. If it is a string, then it is assumed to be the set of characters to match. If it
 *      is a regular expression, then each character is tested against it.
 */
Pointer.prototype.skipTo = function (re) {
    if (utils.isString(re)) {
        re = new RegExp('[' + re + ']');
    }
    var c = this.peek();
    while (!re.test(c) && this.pos < this.line.length) {
        this.pos += 1;
        c = this.peek();
    }
};

/**
 * Moves the pointer forward past all whitespace characters.
 */
Pointer.prototype.skipWS = function () {
    this.skipTo(/\S/);
};

/**
 * Moves the pointer forward to the next non-whitespace character.
 */
Pointer.prototype.skipNonWS = function () {
    this.skipTo(/\s/);
};

/**
 * Sets the mark at the current position.
 */
Pointer.prototype.setMark = function () {
    this.mark = this.pos;
};

/**
 * Returns the substring between the mark and the current position. Also works if the mark is ahead ot the current
 * position.
 * @returns {string} the substring between the mark and the current position
 */
Pointer.prototype.getMarked = function () {
    return this.line.substring(this.mark, this.pos);
};

/**
 * Whether the pointer is at the end of the string.
 * @returns {boolean} true if there are still characters ahead of the current position; false if the pointer is at the
 *      end of the string.
 */
Pointer.prototype.hasMore = function () {
    return this.pos < this.line.length;
};
