var fs = require('fs');
var path = require('path');

var spawn = require('child_process').spawn;

var Commands = function () {

    var me = this;

    me.commands = {
        cd: cd,
        stub: stub,
        exit: exit,
        all: function (cb, args) {
            console.log(Object.keys(me.commands));
            cb();
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
            var stat;
            try {
                stat = fs.statSync(file);
            } catch (ex) {
            }
            if (stat && stat.mode & 0111) { // test for *any* of the execute bits
                me.addCmd(file);
            }
        });
    });
};


Commands.prototype.addCmd = function (file) {
    var name = path.basename(file);
    if (!(name in this.commands)) {
        this.cache[name] = file;
        this.commands[name] = makeCmd(file);
    }
};

function run(file, args, cb) {
    var child = spawn(file, args, {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'inherit'
    });
    child.on('exit', function (status) {
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
