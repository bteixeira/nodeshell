var Visitor = function () {};

Visitor.prototype.visit = function (token) {
    var methodName = 'visit' + token.type;
    var method = this[methodName];
    method.call(this, token);
};

module.exports = Visitor;
