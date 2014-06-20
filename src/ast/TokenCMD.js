var TokenCMD = function (name, args) {
    this.name = name;
    this.args = args;
};

TokenCMD.prototype.type = 'CMD';

TokenCMD.prototype.addArg = function (arg) {
    this.args.push(arg);
};

module.exports = TokenCMD;
