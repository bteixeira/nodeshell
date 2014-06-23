var NodeERR = function (msg, pointer) {
    this.msg = msg;
    this.pos = pointer.pos;
    this.char = pointer.peek();
};

NodeERR.prototype.type = 'ERR';

module.exports = NodeERR;
