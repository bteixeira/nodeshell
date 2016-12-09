var DescentParser = require('./descentParser');
var Tape = require('../tape');
var clt = require('../tokenizer/commandLineTokenizer');
var path = require('path');
var fs = require('fs');
var utils = require('../utils');

exports.parseCmdLine = function (lineReader, commands, panel) {
    var parser = new DescentParser(commands);

    var line = lineReader.getLine();
    var idx = lineReader.cursor;
    line = line.split('');
    line.splice(idx, 0, {type: 'COMPLETION'});

    var tokens = clt(line);

    parser.tape = new Tape(tokens);
    parser.firstCommand = true;
    var ret = parser.COMMAND_LINE();

    var completions = [];

    // check if returned is completion
    if (ret.type === 'COMPLETION') {
        // if so, check completion type
        // if command name, check possible commands for prefix
        if (ret['completion-type'] === 'COMMAND-NAME') {
            var cmdNames = [];
            commands.getCommandNames().forEach(function (cmd) {
                if (cmd.indexOf(ret.prefix) === 0) {
                    cmdNames.push(cmd);
                }
            });
            completions = cmdNames;
        }
        // if command argument, check completion config including default, filtered by prefix
        else if (ret['completion-type'] === 'COMMAND-ARGUMENT') {

            var config;
            var cmd = ret.node.cmd;

            if (cmd in cmdConfig) {
                config = cmdConfig[cmd];
            } else {
                config = $default;
            }

            var args = ret.node.args.map(function(arg) {
                return arg.glob.text;
            });
            completions = getCompletionsFromValue(cmd, args, ret.prefix, config);

        }
        // otherwise, show error while completing
        else {
            throw 'UNKNOWN COMPLETION TYPE';
        }
    } else {
        // if not, show syntax error
        console.log(ret);
        return;
    }

    // if list of completions
    if (completions.length === 0) {
        // if empty, show message
        console.log('\nNo completions\n');
        lineReader.refreshLine();
    } else if (completions.length === 1) {
        // if only one entry, assume it
        //console.log('SUCCESS! COMPLETING WITH:', completions[0]);
        var suffix = completions[0].substr(ret.prefix.length);
        lineReader.moveToEnd(); // TODO COMPLETE WHERE THE CURSOR IS, DON'T ASSUME WE ARE COMPLETING THE WHOLE LINE
        lineReader.insert(suffix + ' ');
    } else {
        // if more than one
        // start with common:=first
        // for each one after first
            // check if it is prefix of common, remove last character until it is
        var common = completions[0];
        for (var i = 1 ; i < completions.length ; i++) {
            while (completions[i].indexOf(common) !== 0) {
                common = common.slice(0, common.length - 1);
            }
        }

        if (common !== ret.prefix) {
            //console.log('WE CAN PARTIALLY COMPLETE WITH:', common);
            suffix = common.substr(ret.prefix.length);
            lineReader.moveToEnd(); // TODO COMPLETE WHERE THE CURSOR IS, DON'T ASSUME WE ARE COMPLETING THE WHOLE LINE
            lineReader.insert(suffix);
        }

        if (panel) {
            panel.clearScreen();
            panel.write('    ' + completions.join('\n    '));
        } else {
            console.log('');
            completions.forEach(function (completion) {
                console.log('\t' + completion);
            });
            console.log('(' + completions.length + ')\n');
            lineReader.refreshLine();
        }
    }

};


function getCompletionsFromArray(cmdName, args, prefix, array) {
    var result = [];
    array.forEach(function (val) {
        var comps = getCompletionsFromValue(cmdName, args, prefix, val);
        //console.log('completions for', val, comps);
        Array.prototype.push.apply(result, comps);
    });
    return result;
}

function getCompletionsFromObject(cmdName, args, prefix, object, nest) {
    nest = nest || 0;
    var result = [];
    if (nest === args.length) {
        return Object.keys(object).filter(function (key) {
            return key.indexOf(prefix) === 0;
        });
    } else {
        var arg = args[nest];
        if (arg in object) {
            var val = object[arg];
            Array.prototype.push.apply(result, getCompletionsFromValue(cmdName, args, prefix, val, nest + 1));
        }
    }
    return result;
}

function getCompletionsFromValue(cmdName, args, prefix, val, nest) {
    if (utils.isArray(val)) {
        return getCompletionsFromArray(cmdName, args, prefix, val);
    } else if (utils.isFunction(val)) {
        return val.call(null, cmdName, args, prefix);
    } else if (utils.isObject(val)) {
        return getCompletionsFromObject(cmdName, args, prefix, val, nest);
    } else {
        return String(val).indexOf(prefix) === 0 ? [val] : [];
    }
}

var $dirName = exports.$dirName = function (cmd, args, prefix) {
    return $fileName(cmd, args, prefix).filter(function(file) {
        return fs.statSync(file).isDirectory();
    });
};

var $fileName = exports.$fileName = function (cmd, args, prefix) {
    var idx = prefix.lastIndexOf(path.sep);
    var dir = prefix.substring(0, idx);
    var filePrefix = prefix.substring(idx + 1);

    if (!fs.existsSync(dir)) {
        dir = utils.expandHomeDir(dir);
    }
    if (!fs.existsSync(dir)) {
        dir = path.resolve(process.cwd(), dir);
    }

    var files = [];

    if (fs.existsSync(dir)) {
        files = fs.readdirSync(dir);
    }
    return files.filter(function (file) {
        return file.lastIndexOf(filePrefix, 0) === 0;
    }).map(function (file) {
        var isDir = fs.statSync(path.join(dir, file)).isDirectory();
        return prefix.substring(0, idx + 1) + file + (isDir ? '/' : '');
    });
};

var $default = $fileName;

var cmdConfig = exports.cmdConfig = {};
