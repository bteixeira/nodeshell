var Visitor = function () {};

Visitor.prototype.visit = function () {
    var token = arguments[0];
    var method = this['visit' + token.type];
    return method.apply(this, Array.prototype.slice.call(arguments));
};

module.exports = Visitor;
