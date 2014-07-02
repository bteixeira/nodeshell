var Autocompleter = function (line, context, commands) {
    this.line = line;
    this.context = context;
    this.commands = commands;
};

// TODO FOR THIS TO BE MODULAR IT HAS TO BE ABLE TO DEFINE SETS OF COMPLETIONS. ALL THIS HAS TO BE MUCH MORE GENERIC.

Autocompleter.prototype.complete = function () {
    var completions = this.getCompletions(this.line.getLine());
    // TODO print below the prompt and show prompt again

    console.log('\n' + completions.join('\t'));
    this.line._refreshLine();
};

Autocompleter.prototype.getCompletions = function (input) {

    return ['bananas', 'bad mo fo', 'orly'];

    var idxDot = input.lastIndexOf('.');
    var idxSpc = input.lastIndexOf(' ');
    if (idxDot > idxSpc) { // completing property // TODO NOT NECESSARILY, DOT MAY BE PART OF FILE NAME OR DIRECTORY STRUCTURE BUT LET'S IGNORE THAT UNTIL WE HAVE THE TOKENIZER IN PLACE
        // TODO EXTRACT LARGEST SEQUENCE OF [\.a-zA-Z0-9_\[\]$] before idxDot (can not start with digit)
        // TODO eval this, catch and ignore any exceptions
        // TODO if eval'd successfully, return this.getProperties(evald, input.substr(idxDot))
    } else { // TODO completing command, file/dir or variable
        // TODO if starting with (, is variable
        // TODO if begginning of input, either var or command
        // TODO else is file or dir
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
    // TODO enumerate properties of obj
};

module.exports = Autocompleter;
