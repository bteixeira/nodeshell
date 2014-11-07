var NodeERR = function (msg, tape) {
    this.msg = msg;
    this.pos = tape.pos;
    this.char = tape.peek();
};

NodeERR.prototype.type = 'ERR';

NodeERR.prototype.toString = function () {
    return this.msg + ', at column ' + this.pos + ' "' + this.char + '"';
};

module.exports = NodeERR;
