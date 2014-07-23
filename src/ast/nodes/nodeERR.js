var NodeERR = function (msg, pointer) {
    this.msg = msg;
    this.pos = pointer.pos;
    this.char = pointer.peek();
};

NodeERR.prototype.type = 'ERR';

NodeERR.prototype.toString = function () {
    return this.msg + ', at column ' + this.pos + ' "' + this.char + '"';
};

module.exports = NodeERR;
