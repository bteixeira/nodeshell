var vm = require('vm');
var path = require('path');
var fs = require('fs');

var utils = require('./utils');

export class Autocompleter {
	private line;
	private context;
	private commands;

	constructor(line, context, commands) {
		this.line = line;
		this.context = context;
		this.commands = commands;
	}

	// TODO FOR THIS TO BE MODULAR IT HAS TO BE ABLE TO DEFINE SETS OF COMPLETIONS. ALL THIS HAS TO BE MUCH MORE GENERIC.
	complete() {
		var comps = this.getCompletions(this.line.getLine(), this.line.cursor);

		if (!comps.completions.length) {
			return
		}

		if (comps.completions.length === 1 && comps.length > 0) {
			this.line.insert(comps.completions[0].substring(comps.length));
		} else {
			console.log('\n' + comps.completions.join('\t') + '\n');
			this.line.refreshLine();
		}
	};

	// TODO Current approach will not complete paths with . or .. which is very lacking
	getCompletions(input, cursor) {

		var idxDot = input.lastIndexOf('.', cursor);
		var idxSpc = input.lastIndexOf(' ', cursor);// TODO CAN ACTUALLY BE ANY WHITESPACE, THIS WON'T FLY

		if (idxDot > idxSpc) { // completing property // TODO NOT NECESSARILY, DOT MAY BE PART OF FILE NAME OR DIRECTORY STRUCTURE BUT LET'S IGNORE THAT UNTIL WE HAVE THE TOKENIZER IN PLACE
			var re = /([a-zA-Z\$_]+[\.a-zA-Z0-9\$_\[\]]*)\.([a-zA-Z0-9_\$]*)$/;
			try {
				/* Extract the value we are trying to complete */
				var ex = re.exec(input.substring(0, cursor));
				try {
					var obj = vm.runInContext(ex[1], this.context);
				} catch (e) {
					/* Value to complete threw exception */
					return {completions: [e.toString() + ' completing ' + ex[1] + ' prefix ' + ex[2]], length: -1};
				}
				var prefix = ex[2];
				var comps = this.getProperties(obj, prefix);
				if (!comps.length) {
					return {completions: ['No completions for ' + ex[1] + ' starting with ' + prefix], length: -1};
				}
				return {
					completions: comps,
					length: prefix.length
				};
			} catch (e) {
				return {completions: [e.toString()], length: -1};
			}
		} else if (idxSpc === -1) {
			prefix = input.substring(0, cursor);
			/* If begginning of input, either var or command */
			return {
				completions: this.getCommands(prefix).concat(this.getVars(prefix)),
				length: prefix.length
			};
		} else {
			prefix = input.substring(idxSpc + 1, cursor);
			// TODO completing file/dir or variable
			// TODO if starting with (, is variable
			// TODO else is file or dir
			return {
				// TODO THIS DOES NOT EVEN COMPLETE PATHS, WHAT A DISGRACE
				completions: this.getFiles(prefix).concat(this.getVars(prefix)),
				length: prefix.length
			};
		}
	};

	getFiles(prefix) {
		// TODO resolve prefix as a path relative to process.getCwd()
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
			return (file.lastIndexOf(filePrefix, 0) === 0);
		}).map(function (file) {
			return prefix.substring(0, idx + 1) + file;
		});
	};

	getCommands(prefix) {
		return this.getProperties(this.commands.commands, prefix);
	};

	getVars(prefix) {
		return this.getProperties(this.context, prefix);
	};

	getProperties(obj, prefix) {
		var props = [];
		for (var p in obj) {
			if (p.lastIndexOf(prefix, 0) === 0) {
				props.push(p);
			}
		}

		return props;
	};
}
