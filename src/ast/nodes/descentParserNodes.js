
exports.REDIR = function (direction, target, fd) {
    return {
        type: 'REDIR',
        direction: direction,
        target: target,
        fd: fd
    };
};

exports.COMMAND = function (cmd, args, redirs) {
    return {
        type: 'COMMAND',
        cmd: cmd,
        args: args,
        redirs: redirs
    };
};

exports.PIPELINE = function (left, right) {
    return {
        type: 'PIPELINE',
        left: left,
        right: right
    };
};

exports.AND_LIST = function (left, right) {
    return {
        type: 'AND_LIST',
        left: left,
        right: right
    };
};

exports.OR_LIST = function (left, right) {
    return {
        type: 'OR_LIST',
        left: left,
        right: right
    };
};

exports.SEQUENCE = function (background, next) {
    return {
        type: 'SEQUENCE',
        background: background,
        next: next
    };
};

exports.GLOB = function (glob) {
    return {
        type: 'GLOB',
        glob: glob
    };
};
exports.JS = function (js) {
    return {
        type: 'JS',
        js: js
    };
};
exports.DQSTRING = function (dqstring) {
    return {
        type: 'DQSTRING',
        token: dqstring
    };
};
