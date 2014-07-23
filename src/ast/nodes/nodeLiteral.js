var NodeLiteral = function (text) {
    this.text = text;
};

NodeLiteral.prototype.type = 'Literal';

module.exports = NodeLiteral;
