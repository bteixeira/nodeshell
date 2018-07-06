import * as fs from 'fs';
import * as path from 'path';

import ChildProcessWRapper from './parser/runners/childProcessWrapper';

export interface Options {
	skipPath?: boolean;
	parent?: Commands;
}

export type Command = (...args: any[]) => any;

export default class Commands {
	public commands: any = {}; // TODO
	private parent: Commands;

	constructor (options: Options = {}) {
		if (!options.skipPath) {
			this.addFromPath();
		}
		if (options.parent) {
			this.parent = options.parent;
		}
	}

	private static isExecutable (file: string): boolean {
		if (process.platform === 'win32') {
			return /\.(exe|bat)$/.test(file);
		}
		try {
			var stat = fs.statSync(file);
		} catch (ex) {
			/* Broken symlink will throw this */
			return false;
		}
		return !!(stat && (stat.mode & 0o111)); // test for *any* of the execute bits
	}

	addFromPath (path_?: string): void {
		var me = this;
		path_ = path_ || process.env.PATH;
		var paths = path_.split(path.delimiter);
		paths.forEach(function (dir) {
			me.addFromDir(dir)
		});
	}

	addFromDir (dir: string): void {
		var me = this;
		var files: string[];
		try {
			files = fs.readdirSync(dir);
		} catch (ex) {
			/* Probably directory in PATH that doesn't exist */
			return;
		}
		files.forEach(file => {
			file = path.resolve(dir, file);
			if (Commands.isExecutable(file)) {
				me.addFromFile(file);
			}
		});
	}

	addFromFile (filename: string): void {
		var basename = path.basename(filename);
		if (process.platform === 'win32') {
			basename = basename.substr(0, basename.lastIndexOf('.'));
		}
		this.addCommand(basename, Commands.makeCmd(filename), filename);
	}

	private static makeCmd (filename: string): Command {
		return function (args) {
			return new ChildProcessWRapper(filename, args);
		}
	}

	addCommand (name: string, body, path: string = '[builtin]'): void {
		this.commands[name] = {runner: body, path: path};
	}

	isCmd (candidate: string): boolean {
		return candidate in this.commands || (this.parent && this.parent.isCmd(candidate));
	}

	getCmd (name: string, args) {
		if (name in this.commands) {
			return this.commands[name].runner(args);
		} else if (this.parent) {
			return this.parent.getCmd(name, args);
		}
	}

	getCommandNames (): string[] {
		var names = Object.keys(this.commands);
		if (this.parent) {
			Array.prototype.push.apply(names, this.parent.getCommandNames());
		}
		return names;
	}
}
