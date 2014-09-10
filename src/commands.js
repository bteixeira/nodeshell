var fs = require('fs');
var path = require('path');

var utils = require('./utils');
var spawn = require('child_process').spawn;

var Commands = function (options) {

    options = options || {};

    this.commands = {};

    if (!options.skipPath) {
        this.addFromPath();
    }

    if (options.parent) {
        this.parent = options.parent;
    }
};

var isExecutable = Commands.isExecutable = function (file) {
    if (process.platform === 'win32') {
        return /\.(exe|bat)$/.test(file);
    }
    var stat = fs.statSync(file);
    return (stat && (stat.mode & 0111)); // test for *any* of the execute bits
};

Commands.prototype.addFromPath = function (path_) {
    var me = this;
    path_ = path_ || process.env.PATH;
    var paths = path_.split(path.delimiter);
    paths.forEach(function (dir) {
        me.addFromDir(dir)
    });
};

Commands.prototype.addFromDir = function (dir) {
    var me = this;
    var files;
    try {
        files = fs.readdirSync(dir);
    } catch (ex) {
        return;
    }
    files.forEach(function (file) {
        file = path.resolve(dir, file);
        if (isExecutable(file)) {
            me.addFromFile(file);
        }
    });
};

Commands.prototype.addFromFile = function (filename) {
    var basename = path.basename(filename);
    if (process.platform === 'win32') {
        basename = basename.substr(0, basename.lastIndexOf('.'));
    }
    this.addCommand(basename, makeCmd(filename));
};

Commands.prototype.addCommand = function (name, body) {
    this.commands[name] = body;
};

Commands.prototype.addCommands = function (commands) {
    utils.extend(this.commands, commands);
};

function run(file, args, cb) {
    process.stdin.setRawMode(false);
    process.stdin.pause();
    var child = spawn(file, args, {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'inherit'
    });
    child.on('exit', function (status) {
        process.stdin.resume();
        process.stdin.setRawMode(true);
        cb(status);
    });
}

function makeCmd(file) {
    return function (cb, args) {
        run(file, args, cb);
    }
}

Commands.prototype.isCmd = function (candidate) {
    return candidate in this.commands || (this.parent && this.parent.isCmd(candidate));
};

Commands.prototype.getCmd = function (name) {
    return this.commands[name] || (this.parent && this.parent.getCmd(name));
};

Commands.prototype.runCmd = function (name, args, cb) {
    var cmd = this.getCmd(name);
    return cmd(cb, args);
};

module.exports = Commands;
