var lastActive;
var oldFooterHeight = 0;
var rl = require('readline');

module.exports = function Writer (stdout) {

    var parent;
    var content = [];
    var row = 1;
    var col = 1;
    var footer;
    var height = 1;
    var redraw = function (){};

    function insertNewLine(/*skipChecks*/) {
        var spaceBelow = parent.getSpaceBelowChild(this);
        var offsetH = parent.getChildOffsetH(this);
        var width = parent.getChildWidth(this);
        row += 1;
        var oldCol = col;
        col = 1;
        if (row > height) {
            stdout.write(new Array(spaceBelow + 2).join('\n'));
            rl.moveCursor(stdout, offsetH, -spaceBelow);
            stdout.write(new Array(width + 1).join(' '));
            rl.moveCursor(stdout, -width + (
                    // if this panel is on the right edge of the screen, the cursor is actually one character behind
                    offsetH + width === stdout.columns ? 1 : 0
                ), 0);
            this.rows = height = row;
            parent.redrawBelowChild(this);
        } else {
            rl.moveCursor(stdout, -oldCol + 1 + (
                    // if this panel is on the right edge of the screen, the cursor is actually one character behind
                    offsetH + oldCol === stdout.columns ? 1 : 0
                ), 1);
        }
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



    var me = {
        rows: 1,
        setFooter: function (footer_) {
            footer = footer_;
        },
        insert: function (ch, skipChecks) {
            if (ch.charCodeAt(0) === 127) {
                if (col > 1) {
                    stdout.write(ch);
                    stdout.write(' ');
                    stdout.write(ch);
                    col -= 1;
                    content.splice(content.length - 1, 1);
                }
            } else if (ch === '\n' || ch === '\r') { // TODO DIFFERENTIATE THESE TWO
                content.push(ch);
                insertNewLine.call(this, skipChecks);
            } else {
                stdout.write(ch);
                if (!skipChecks) {
                    content.push(ch);
                }
                col += 1;
                var width = parent.getChildWidth(this);
                if (col > width) {
                    insertNewLine.call(this, skipChecks);
                }
            }
        },
        write: function (str) {
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
        },
        superWrite3: function (buf) {
            var active = Writer.active;
            if (active !== this) {
                this.activate();
            }



            var tmp = '';
            var len = 0;

            iterateEscapedString(buf, function (seq, isEscape) {
                if (isEscape) {
                    //stdout.write(seq);
                    tmp += seq;
                } else {
                    if (seq.charCodeAt(0) === 127) { //backspace
                        //if (col > 1) {
                        if (col + len > 1) {
                            //stdout.write(seq);
                            tmp += seq;
                            len -= 1;
                        }
                    } else if (seq === '\n') {
                        stdout.write(tmp);
                        col += len;
                        tmp = '';
                        len = 0;
                        insertNewLine.call(me);
                    } else if (seq === '\r') {
                        stdout.write(tmp);
                        col += len;
                        tmp = '';
                        len = 0;
                        me.moveCursor(-col, 0);
                    } else {
                        //stdout.write(seq);
                        tmp += seq;
                        len += seq.length;
                        //col += 1;
                        //if (col > me.getWidth()) {
                        if (col + len > me.getWidth()) {
                            stdout.write(tmp);
                            col += len;
                            tmp = '';
                            len = 0;
                            insertNewLine.call(me);
                        }
                    }
                }
            });

            if (tmp) {
                stdout.write(tmp);
                col += len;
                tmp = '';
                len = 0;
                if (col > me.getWidth()) {
                    insertNewLine.call(me);
                }
            }


            if (active !== this) {
                active.activate();
            }
        },
        superWrite2: function (buf) {
            var active = Writer.active;
            if (active !== this) {
                this.activate();
            }



            iterateEscapedString(buf, function (seq, isEscape) {
                if (isEscape) {
                    stdout.write(seq);
                } else {
                    if (seq.charCodeAt(0) === 127) { //backspace
                        if (col > 1) {
                            stdout.write(seq);
                            col -= 1;
                        }
                    } else if (seq === '\n') {
                        insertNewLine.call(me);
                    } else if (seq === '\r') {
                        me.moveCursor(-col, 0);
                    } else {
                        stdout.write(seq);
                        col += 1;
                        if (col > me.getWidth()) {
                            insertNewLine.call(me);
                        }
                    }
                }
            });



            if (active !== this) {
                active.activate();
            }
        },
        superWrite: function (buf) {
            var active = Writer.active;
            if (active !== this) {
                this.activate();
            }

            var w = this.getWidth() - col + 1;
            var chunks = [];



            //var len = splitBufferAt(buf, w, chunks);
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

            //return sum;
            var len = sum;
            ////////




            stdout.write(chunks[0]);
            col += len;
            if (len === w) {
                insertNewLine.call(this/*, true?*/);
            }
            if (chunks[1]) {
                this.superWrite(chunks[1]);
            }

            if (active !== this) {
                active.activate();
            }
        },
        moveCursor: function (dx, dy) {
            if (typeof dy === 'undefined') {
                dy = 0;
            }

            var col_ = col + dx;
            if (col_ < 1) {
                col_ = 1;
                dx = -col + 1;
            } else if (col_ > parent.getChildWidth(this)) {
                col_ = parent.getChildWidth(this);
                dx = col_ - col;
            }
            col = col_;

            var row_ = row + dy;
            if (row_ < 1) {
                row_ = 1;
                dy = -row + 1;
            } else if (row_ > this.getHeight()) {
                row_ = this.getHeight();
                dy = row_ - row;
            }
            row = row_;

            if (this === Writer.active) {
                rl.moveCursor(stdout, dx, dy);
            }
        },
        cursorTo: function (x, y) {
            if (typeof y === 'undefined') {
                y = row;
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

            if (this === Writer.active) {
                rl.moveCursor(stdout, -col + x, -row + y);
            }
            col = x;
            row = y;
        },
        rewrite: function () {
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
            redraw.call(this);
        },
        rewind: function () {
            rl.moveCursor(stdout, -col + 1, -row + 1);
        },
        activate: function () {
            var offsetThis = this.getOffset();
            var diff = 0;
            var active = Writer.active;
            if (!active) {
                // no active panel, this is the first time we're activating
                // cursor starts out at top left most
                rl.moveCursor(stdout, offsetThis[1], offsetThis[0]);
            } else if (this.isFooter() && !active.isFooter()) {
                saveCursor(stdout);
                lastActive = active;
                rl.cursorTo(stdout, offsetThis[1], stdout.rows - footer.getHeight() + offsetThis[0]);
                if (footer) {
                    oldFooterHeight = footer.getHeight();
                }
            } else {
                if (active.isFooter() && !this.isFooter()) {
                    restoreCursor(stdout);
                    active = lastActive;
                    if (footer) {
                        diff = footer.getHeight() - oldFooterHeight;
                    }
                }

                var offsetThat = active.getOffset();
                var delta = [offsetThis[0] - offsetThat[0], offsetThis[1] - offsetThat[1]];

                rl.moveCursor(stdout, delta[1], delta[0] - diff);

            }
            Writer.active = this;
        },
        getOffset: function () {
            var offset = parent.getChildOffset(this);
            return [offset[0] + row - 1, offset[1] + col - 1];
        },
        getHeight: function () {
            return height;
        },
        setParent: function (parent_) {
            parent = parent_;
        },
        calculateWidth: function () {
            this.columns = parent.getChildWidth(this);
        },
        isFooter: function () {
            return parent.isFooter(this);
        },
        /**
         * Assumes the cursor is at the top left of the root layout and repositions it to this panel's cursor position.
         * TODO this method probably shouldn't exist, this should happen naturally as a side effect of other methods. We're
         * specifically putting this here for after a command has been executed and the prompt needs to redraw; in that
         * case, the cursor is actually on the top left, but the active panel still thinks the cursor is where it left it.
         * Either have a way to signal the active panel that it lost focus or have a general reset method that builds the
         * whole layout assuming the cursor is at the beginning of input.
         */
        repositionCursor: function () {
            var offset = this.getOffset();
            rl.moveCursor(stdout, offset[1], offset[0]);
        },
        /**
         * Resets the buffered content of this panel. Does not clean the screen.
         */
        reset: function () {
            content = [];
            row = col = height = 1;
        },


        getWidth: function () {
            return parent.getChildWidth(this);
        },



        clearScreenDown: function () {
            var active = Writer.active;
            if (active !== this) {
                this.activate();
            }

            var oldCol = col;
            var oldRow = row;
            var width = this.getWidth();

            while (row < height) {
                //this.write( new Array(this.getWidth() - col + 2).join(' ') );
                stdout.write( new Array(width - col + 2).join(' ') );
                rl.moveCursor(stdout, -width, 1);
                row += 1;
                col = 1;
            }

            // the cursor is on the last line, therefore there must be no character at the last position (otherwise
            // a new line would have been allocated). Therefore do not write until the last character, otherwise a
            // new line will be added as a result of clear screen which doesn't look nice
            //this.write( new Array(this.getWidth() - col + 1).join(' ') );
            stdout.write( new Array(width - col + 1).join(' ') );
            col = width;

            this.cursorTo(oldCol, oldRow);

            if (active !== this) {
                active.activate();
            }
        },
        clearScreen: function () {
            // TODO
            this.cursorTo(1, 1);
            this.clearScreenDown();
        },
        clearLine: function () {
            // TODO
        },
        clearLineLeft: function () {
            // TODO
        },
        clearLineRight: function () {
            // TODO
        },

        setRedraw: function (redraw_) {
            redraw = redraw_;
        }
    };

    return me;
};

function saveCursor(stdout) {
    stdout.write('\033[s');
}
function restoreCursor(stdout) {
    stdout.write('\033[u');
}
