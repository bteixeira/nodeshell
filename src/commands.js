
var Commands = function () {

};

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

var commands = {
    cd: cd,
    stub: stub,
    exit: exit
};

Commands.prototype.getCmd = function (cmd) {
    return commands[cmd];
};

Commands.prototype.isCmd = function (candidate) {
    return !!this.getCmd(candidate);
};

module.exports = Commands;
