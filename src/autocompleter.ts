import * as vm from 'vm';
import * as path from 'path';
import * as fs from 'fs';

import LineReader from './lineReader';
import CommandSet from './commandSet';
import * as utils from './utils';

class Completions {
	public completions: string[];
	public length: number;
}

export class Autocompleter {
	private lineReader: LineReader;
	private context: Object;
	private commands: CommandSet;

	constructor (line: LineReader, context: Object, commands: CommandSet) {
		this.lineReader = line;
		this.context = context;
		this.commands = commands;
	}

	// TODO FOR THIS TO BE MODULAR IT HAS TO BE ABLE TO DEFINE SETS OF COMPLETIONS. ALL THIS HAS TO BE MUCH MORE GENERIC.
	complete (): void {
		const comps: Completions = this.getCompletions(this.lineReader.getLine(), this.lineReader.cursor);

		if (!comps.completions.length) {
			return
		}

		if (comps.completions.length === 1 && comps.length > 0) {
			this.lineReader.insert(comps.completions[0].substring(comps.length));
		} else {
			console.log('\n' + comps.completions.join('\t') + '\n');
			this.lineReader.refreshLine();
		}
	};

	// TODO Current approach will not complete paths with . or .. which is very lacking
	getCompletions (input: string, cursor: number): Completions {
		const idxDot = input.lastIndexOf('.', cursor);
		const idxSpc = input.lastIndexOf(' ', cursor);// TODO CAN ACTUALLY BE ANY WHITESPACE, THIS WON'T FLY

		if (idxDot > idxSpc) { // completing property // TODO NOT NECESSARILY, DOT MAY BE PART OF FILE NAME OR DIRECTORY STRUCTURE BUT LET'S IGNORE THAT UNTIL WE HAVE THE TOKENIZER IN PLACE
			const re = /([a-zA-Z\$_]+[\.a-zA-Z0-9\$_\[\]]*)\.([a-zA-Z0-9_\$]*)$/;
			try {
				/* Extract the value we are trying to complete */
				const ex = re.exec(input.substring(0, cursor));
				try {
					var obj = vm.runInContext(ex[1], this.context);
				} catch (e) {
					/* Value to complete threw exception */
					return {completions: [e.toString() + ' completing ' + ex[1] + ' prefix ' + ex[2]], length: -1};
				}
				var prefix = ex[2];
				var comps = Autocompleter.getProperties(obj, prefix);
				if (!comps.length) {
					return {completions: ['No completions for ' + ex[1] + ' starting with ' + prefix], length: -1};
				}
				return {
					completions: comps,
					length: prefix.length,
				};
			} catch (e) {
				return {completions: [e.toString()], length: -1};
			}
		} else if (idxSpc === -1) {
			prefix = input.substring(0, cursor);
			/* If begginning of input, either var or command */
			return {
				completions: this.getCommands(prefix).concat(this.getVars(prefix)),
				length: prefix.length,
			};
		} else {
			prefix = input.substring(idxSpc + 1, cursor);
			// TODO completing file/dir or variable
			// TODO if starting with (, is variable
			// TODO else is file or dir
			return {
				// TODO THIS DOES NOT EVEN COMPLETE PATHS, WHAT A DISGRACE
				completions: this.getFiles(prefix).concat(this.getVars(prefix)),
				length: prefix.length,
			};
		}
	};

	getFiles (prefix: string): string[] {
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

		var files: string[] = [];

		if (fs.existsSync(dir)) {
			files = fs.readdirSync(dir);
		}
		return files.filter(file => (file.lastIndexOf(filePrefix, 0) === 0)).map(file => (prefix.substring(0, idx + 1) + file));
	};

	getCommands (prefix: string): string[] {
		return Autocompleter.getProperties(this.commands.commands, prefix);
	};

	getVars (prefix: string): string[] {
		return Autocompleter.getProperties(this.context, prefix);
	};

	private static getProperties (obj: Object, prefix: string): string[] {
		const props: string[] = [];
		Object.keys(obj).forEach(p => {
			if (p.lastIndexOf(prefix, 0) === 0) { // TODO WHY DO WE NEED TO PASS ZERO?
				props.push(p);
			}
		});
		return props;
	};
}
