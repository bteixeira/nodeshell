var DescentParser = require('./descentParser');
var Tape = require('../tape');
var clt = require('../tokenizer/commandLineTokenizer');
var ast = require('../ast/nodes/descentParserNodes');
var CompletionToken = require('./completionToken');
var Autocompleter = require('../autocompleter');
var autocomp = new Autocompleter();

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
            completions = autocomp.getFiles(ret.prefix);
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
        lineReader.insert(suffix);
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
