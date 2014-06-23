var TokenLiteral = function (text) {
    this.text = text;
};

TokenLiteral.prototype.type = 'Literal';

module.exports = TokenLiteral;
