var fs = require('fs');
var path = require('path');

var spawn = require('child_process').spawn;

var Commands = function () {

};

var commands = {
    cd: cd,
    stub: stub,
    exit: exit,
    all: all
};

var cache = {};

var paths = process.env.PATH.split(path.delimiter);
paths.forEach(function (dir) {
    console.log(dir);
    var files;
    try {
        files = fs.readdirSync(dir);
    } catch (ex) {
        return;
    }
    files.forEach(function (file) {
        file = path.resolve(dir, file);
//        console.log('\t', file);
        var stat;
        try {
            stat = fs.statSync(file);
        } catch (ex) {
        }
        if (stat && stat.mode & 0111) { // test for *any* of the execute bits
            addCmd(file);
        }
    });
});

function addCmd (file) {
    var name = path.basename(file);
//    console.log('adding', file);
    if (! (name in commands)) {
        cache[name] = file;
        commands[name] = makeCmd(file);
    }
}

function run (file, args) {
    spawn(file, args, {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'inherit'
    });
}

function makeCmd (file) {
    return function () {
//        console.log('will now run', file);
        run (file, Array.prototype.slice.call(arguments, 0));
    }
}

function cd (dir) {
    //console.log ('changing to', dir);
    return process.chdir(dir);
}

function stub () {
    console.log('This is simply a stub command.');
    console.log('You gave me these arguments:', arguments);
}

function exit () {
    process.exit();
}

function all () {
    console.log(Object.keys(commands));
}

Commands.prototype.getCmd = function (cmd) {
    return commands[cmd];
};

Commands.prototype.isCmd = function (candidate) {
    return !!this.getCmd(candidate);
};

module.exports = Commands;
