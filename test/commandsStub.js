var cmds = {
    'cd': true,
    'ls': true,
    'man': true,
    'pwd': true,
    'git': true,
    'node': true,
    'npm': true,
    'stub': true,
    'all': true
};

exports.isCmd = function (name) {
    return name in cmds;
};
