var vm = require('vm');

var Autocompleter = function (line, context, commands) {
    this.line = line;
    this.context = context;
    this.commands = commands;
};

// TODO FOR THIS TO BE MODULAR IT HAS TO BE ABLE TO DEFINE SETS OF COMPLETIONS. ALL THIS HAS TO BE MUCH MORE GENERIC.

Autocompleter.prototype.complete = function () {
    var completions = this.getCompletions(this.line.getLine(), this.line.cursor);

    if (completions && completions.length) {
        console.log('\n' + completions.join('\t'));
        this.line._refreshLine();
    }
};

Autocompleter.prototype.getCompletions = function (input, cursor) {

//    return ['bananas', 'bad mo fo', 'orly'];

    var idxDot = input.lastIndexOf('.', cursor);
    var idxSpc = input.lastIndexOf(' ', cursor);

    if (idxDot > idxSpc) { // completing property // TODO NOT NECESSARILY, DOT MAY BE PART OF FILE NAME OR DIRECTORY STRUCTURE BUT LET'S IGNORE THAT UNTIL WE HAVE THE TOKENIZER IN PLACE
        // TODO EXTRACT LARGEST SEQUENCE OF [\.a-zA-Z0-9_\[\]$] before idxDot (can not start with digit)
        // TODO eval this, catch and ignore any exceptions
        // TODO if eval'd successfully, return this.getProperties(evald, input.substr(idxDot))
        var subs = input.substring(0, idxDot);
//        var re = /[\.a-zA-Z0-9\$\[\]]+$/;
        var re = /([a-zA-Z\$_]+[\.a-zA-Z0-9\$_\[\]]*)\.([a-zA-Z0-9_\$]*)$/;
        try {
            var ex = re.exec(subs);
            try {
                var obj = vm.runInContext(ex[1], this.context);
            } catch (e) {
                return [e.toString() + ' completing ' + ex[1] + ' prefix ' + ex[2]];
            }
            var prefix = ex[2];
            var comps = this.getProperties(obj, prefix);
            if (!comps.length) {
//                throw 1;
                return ['No completions for ' + ex[1] + ' starting with ' + prefix];
            }
        } catch (e) {
//            return ['No completions for ' + val];
//            return [];
//            console.log(e); // TODO DELETE ME
            return [e.toString()];
        }
    } else { // TODO completing command, file/dir or variable
        // TODO if starting with (, is variable
        // TODO if begginning of input, either var or command
        // TODO else is file or dir
        return ['bananas', 'bad mo fo', 'orly'];
    }
};

Autocompleter.prototype.getFiles = function (prefix) {
    // TODO resolve prefix as a path relative to process.getCwd()
};

Autocompleter.prototype.getVars = function (prefix) {
    // TODO list properties of this.context
};

Autocompleter.prototype.getCommands = function (prefix) {
    // TODO list commands from this.command
};

Autocompleter.prototype.getProperties = function (obj, prefix) {
    var props = [];
    for (var p in obj) {
        if (p.lastIndexOf(prefix, 0) === 0) {
            props.push(p);
        }
    }

    return props;

//    return Object.keys(obj);
};

module.exports = Autocompleter;
