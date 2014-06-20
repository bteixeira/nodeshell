var TokenLiteral = function (text) {
    this.text = text;
};

TokenLiteral.prototype.type = 'Literal';

TokenLiteral.exports = TokenLiteral;
