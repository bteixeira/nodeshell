module.exports = function (token) {
    this.token = token;
    this.type = {
        id: 'COMPLETION'
    };
    this.text = token.text;
    this.pos = token.pos;
};
