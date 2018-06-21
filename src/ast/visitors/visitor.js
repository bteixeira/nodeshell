var Visitor = function () {};

Visitor.prototype.visit = function () {
    var token = arguments[0];
    var method = this[`visit${token.type}`];
    if (!method) {
        throw new Error(`${this} has no implementation for visit${token.type}`);
    }
    return method.apply(this, Array.prototype.slice.call(arguments));
};

module.exports = Visitor;
