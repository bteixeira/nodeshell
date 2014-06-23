var NodeCMD = function (name, args) {
    this.name = name;
    this.args = args || [];
};

NodeCMD.prototype.type = 'CMD';

NodeCMD.prototype.addArg = function (arg) {
    this.args.push(arg);
};

module.exports = NodeCMD;
