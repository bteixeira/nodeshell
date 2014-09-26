var Commands = require('./commands');
var ErrorWrapper = require('./errorWrapper');

module.exports = function (context) {

    var commands = new Commands();

    commands.addCommands({
        cd: cd,
        stub: stub,
        exit: exit,
        all: function (cb, args) {
            console.log(Object.keys(commands.commands));
            cb();
        },
        source: function (cb, args) {
            var value;
            if (args.length) {
                value = utils.sourceSync(args[0], context);
            }
            cb(value);
        }
    });

    return commands;

};

function cd(cb, args) {
    var result;
    try {
        result = process.chdir(args[0]);
    } catch (ex) {
        result = new ErrorWrapper(ex);
    }
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
