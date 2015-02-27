var fs = require('fs');
var path = require('path');

var utils = require('./utils');
var CPWrapper = require('./parser/runners/cpWrapper');
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
    try {
        var stat = fs.statSync(file);
    } catch (ex) {
        /* Broken symlink will throw this */
        return false;
    }
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
        /* Probably directory in PATH that doesn't exist */
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
    this.addCommand(basename, makeCmd(filename), filename);
};

function makeCmd (filename) {
    return function (args) {
        return new CPWrapper(filename, args);
    }
}

Commands.prototype.addCommand = function (name, body, path) {
    path = path || '[builtin]';
    this.commands[name] = {runner: body, path: path};
};

//Commands.prototype.addCommands = function (commands) {
//    utils.extend(this.commands, commands);
//};

//function run(file, args, cb) {
//    process.stdin.setRawMode(false);
//    process.stdin.pause();
//    var child = spawn(file, args, {
//        cwd: process.cwd(),
//        env: process.env,
//        stdio: 'inherit'
//    });
//    child.on('exit', function (status) {
//        process.stdin.resume();
//        process.stdin.setRawMode(true);
//        cb(status);
//    });
//}

//function makeCmd(file) {
//    return function (cb, args) {
//        run(file, args, cb);
//    }
//}

Commands.prototype.isCmd = function (candidate) {
    return candidate in this.commands || (this.parent && this.parent.isCmd(candidate));
};

Commands.prototype.getCmd = function (name, args) {
    if (name in this.commands) {
        return this.commands[name].runner(args);
    } else if (this.parent) {
        return this.parent.getCmd(name, args);
    }
};

Commands.prototype.getCommandNames = function () {
    return Object.keys(this.commands)
};

//Commands.prototype.runCmd = function (name, args, cb) {
//    var cmd = this.getCmd(name);
//    return cmd(cb, args);
//};

/*
//should not be needed
Commands.prototype.getPath = function (name) {
    if (name in this.commands) {
        return this.commands[name].path;
    } else if (this.parent) {
        return this.parent.getPath(name);
    }
};
*/

module.exports = Commands;
