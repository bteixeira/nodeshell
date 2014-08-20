var History = function (line) {
    this.index = -1;
    this.stack = [];
    this.line = line;
};

History.prototype.prev = function () {
    if (this.index < 0 && this.line.getLine()) {
        this.push();
        this.index = 0;
    }
    this.index = Math.min(this.stack.length - 1, this.index + 1);
    var item = this.stack[this.index];
    if (item) {
        this.line.setLine(item).refreshLine();
    }
};

History.prototype.next = function () {
    if (this.index < 0 && this.line.getLine()) {
        this.push();
        this.line.deleteLine();
    } else {
        this.index = Math.max(-1, this.index - 1);
        this.line.setLine(this.stack[this.index] || '').refreshLine();
    }
};

History.prototype.push = function () {
    var line = this.line.getLine().trim();
    if (line) {
        this.stack.unshift(line);
    }
};

History.prototype.rewind = function () {
    this.index = -1;
};

module.exports = History;
