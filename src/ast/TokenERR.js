var TokenERR = function (msg, pointer) {
    this.msg = msg;
    this.pos = pointer.pos;
    this.char = pointer.peek();
};

TokenERR.prototype.type = 'ERR';

module.exports = TokenERR;
