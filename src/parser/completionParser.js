var DescentParser = require('./descentParser');
var Tape = require('../tape');
var clt = require('../tokenizer/commandLineTokenizer');
var ast = require('../ast/nodes/descentParserNodes');
var CompletionToken = require('./completionToken');
var Autocompleter = require('../autocompleter');
var autocomp = new Autocompleter();
var path = require('path');
var fs = require('fs');
var utils = require('../utils');

exports.parseCmdLine = function (lineReader, commands) {
    var parser = new DescentParser(commands);

    var tokens = clt(lineReader.getLine());
    var last = tokens[tokens.length - 1];
    tokens[tokens.length - 1] = new CompletionToken(last);

//    console.log('\n', tokens);

    parser.tape = new Tape(tokens);
    parser.firstCommand = true;
    var ret = parser.COMMAND_LINE();

    /*
    console.log(ret);
    return;
    */

    // TODO

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

            //completions = autocomp.getFiles(ret.prefix);


            // TODO RETRIEVE AUTOCOMPLETIONS FOR SPECIFIC COMMAND

            var config;
            var cmd = ret.node.cmd;

            if (cmd in cmdConfig) {
                //console.log('\ncustom completion for', cmd);
                config = cmdConfig[cmd];
            } else {
                console.log('no custom completion for', cmd);
                config = $default;
            }
            //console.log('getting completions with config', config);

            var args = ret.node.args.map(function(arg) {
                //console.log('arg is', arg);
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

        //console.log('COMPLETIONS:', completions);
        console.log('');
        completions.forEach(function (completion) {
            console.log('\t' + completion);
        });
        console.log('(' + completions.length + ')\n');
        lineReader.refreshLine();
    }


/*
n

nodesh
node
nodeshock
nodes
nodeshell



 */







//    if (parser.firstCommand && ret.err) {
//        ret.firstCommand = true;
//    }
//    return ret;
};

//exports.parseJS = function (line) {
//    return ast.JS({text: line, js: line});
//};

function getCompletionsFromArray(cmdName, args, prefix, array) {
    //console.log('\ngetting for arr', cmdName, args, prefix, array, '|');
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
    //console.log('\ngetting for obj', cmdName, args, prefix, object, nest, '|');
    var result = [];
    //var keys = Object.keys(object);
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

function $dirName(cmd, args, prefix) {
    return $fileName(cmd, args, prefix).filter(function(file) {
        return fs.statSync(file).isDirectory();
    });
}

function $fileName(cmd, args, prefix) {
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
}

var $default = $fileName;

function $branch () {
    return ['STUB-BRANCH-NAME'];
}

function $commit () {
    return ['STUB-COMMIT-ID'];
}

function $path () {
    return ['STUB-PATH'];
}

var cmdConfig = {

    cd: $dirName,

    git: {
        add: ['-n', '-v', '--force', '-f', '--interactive', '-i', '--patch', '-p',
            '--edit', '-e', '--all', '--no-all', '--ignore-removal', '--no-ignore-removal', '--update', '-u',
            '--intent-to-add', '-N', '--refresh', '--ignore-errors', '--ignore-missing',
            '--', '<pathspec>'],
        branch: [

            '--color', '--color=<when>', '--no-color', '-r', '-a', '--list', '-v', '--abbrev=<length>', '--no-abbrev',
'--column', '--column=<options>', '--no-column', '--merged', '--no-merged', '--contains', '<commit>', '<pattern>',

            '--set-upstream', '--track', '--no-track', '-l', '-f', '<branchname>', '<start-point>',

            '--set-upstream-to=<upstream>', '-u <upstream>', '--unset-upstream [<branchname>]', '-m', '-M', '-d', '-D', '-r', '--edit-description'

],
        /* Let's try to make a real case out of checkout */
        checkout: [
            '-q', '-f', '-m', $branch, $commit,
            {'--detach': [$branch, $commit]},
            {'-b': $branch},
            {'-B': $branch},
            {'--orphan': $branch},
            '--ours', '--theirs', '--conflict=<style>',
            {'--': $path},
            '-p', '--patch'

        ],
        clone: [],
        commit: [],
        diff: [],
        fetch: [],
        grep: [],
        init: [],
        log: [],
        merge: [],
        mv: [],
        pull: [],
        push: [],
        rebase: [],
        reset: [],
        rm: [],
        show: [],
        status: [],
        help: ['add', 'branch', 'checkout', 'clone', 'commit', 'diff', 'fetch',
            'grep',
            'init',
            'log',
            'merge',
            'mv',
            'pull',
            'push',
            'rebase',
            'reset',
            'rm',
            'show',
            'status']
    }

};
