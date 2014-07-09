var fs = require('fs');
var path = require('path');
var utils = require('./utils');

var spawn = require('child_process').spawn;

var Commands = function (context) {

    var me = this;

    me.commands = {
        cd: cd,
        stub: stub,
        exit: exit,
        all: function (cb, args) {
            console.log(Object.keys(me.commands));
            cb();
        },
        source: function (cb, args) {
            if (!args.length) {
                cb();
                return;
            }
            var value = utils.sourceSync(args[0], context);
            cb(value);
        }
    };

    me.cache = {};

    me.paths = process.env.PATH.split(path.delimiter);
    me.paths.forEach(function (dir) {
        var files;
        try {
            files = fs.readdirSync(dir);
        } catch (ex) {
            return;
        }
        files.forEach(function (file) {
            file = path.resolve(dir, file);
            if (isExecutable(file)) {
                me.addCmd(file);
            }

        });
    });
};

function isExecutable(file) {
    if (process.platform === 'win32') {
        return /\.(exe|bat)$/.test(file);
    }
    var stat;
    try {
        stat = fs.statSync(file);
    } catch (ex) {
    }
    if (stat && stat.mode & 0111) { // test for *any* of the execute bits
        return true
    }
    return false;
}

Commands.prototype.addCmd = function (file) {
    var name = path.basename(file);
    if (process.platform === 'win32') {
        name = name.substr(0, name.lastIndexOf('.'));
    }
    if (!(name in this.commands)) {
        this.cache[name] = file;
        this.commands[name] = makeCmd(file);
    }
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

function cd(cb, args) {
    var result = process.chdir(args[0]);
    cb(result);
}

function stub(cb, args) {
    console.log('This is simply a stub command.');
    console.log('You gave me these arguments:', args);
    cb();
}

function exit() {
    process.exit();
}

//Commands.prototype.getCmd = function (cmd) {
//    return this.commands[cmd];
//};

Commands.prototype.isCmd = function (candidate) {
    return candidate in this.commands;
};

Commands.prototype.runCmd = function (cmd, args, cb) {
    return this.commands[cmd](cb, args);
};

module.exports = Commands;
