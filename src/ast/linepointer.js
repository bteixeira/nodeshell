var Pointer = module.exports = function (line) {
    this.line = line;
    this.pos = 0;
    this.mark = 0;
};

Pointer.prototype.next = function () {
    var c = this.line.charAt(this.pos);
    this.pos = Math.min(this.pos + 1, this.line.length);
    return c;
};

Pointer.prototype.prev = function () {
    var c = this.line.charAt(this.pos);
    this.pos = Math.max(this.pos - 1, 0);
    return c;
};

Pointer.prototype.peek = function () {
    return this.line[this.pos];
};

Pointer.prototype.skipTo = function (re) {
    if (typeof re === 'string') {
        re = new RegExp('[' + re + ']');
    }
    var c = this.line[this.pos];
    while (!re.test(c) && this.pos < this.line.length) {
        this.pos += 1;
        c = this.line[this.pos];
    }
};

Pointer.prototype.skipWS = function () {
    this.skipTo(/\S/);
};

Pointer.prototype.skipNonWS = function () {
    this.skipTo(/\s/);
};

Pointer.prototype.setMark = function () {
    this.mark = this.pos;
};

Pointer.prototype.getMarked = function () {
    return this.line.substring(this.mark, this.pos);
};

Pointer.prototype.hasMore = function () {
    return this.pos < this.line.length;
};
