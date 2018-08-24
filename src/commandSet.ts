import * as fs from 'fs';
import * as path from 'path';

import ChildProcessWRapper from './parser/runnables/childProcessRunnable';
import {Runnable} from './parser/runnables/runnable'

export type commandHandler = (...args: Runnable[]) => Runnable;
export type commandSpec = {
	runner: commandHandler;
	path: string;
};

/**
 * Keeps track of available commands by name.
 */
export default class CommandSet {
	public commands: {[name: string]: commandSpec} = {}; // TODO

	constructor (private parent?: CommandSet) {
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

	addFromPath (path_: string): void {
		path_.split(path.delimiter).forEach((dir: string) => {
			this.addFromDir(dir)
		});
	}

	addFromDir (dir: string): void {
		var files: string[];
		try {
			files = fs.readdirSync(dir);
		} catch (ex) {
			/* Probably directory in PATH that doesn't exist */
			return;
		}
		files.forEach(file => {
			file = path.resolve(dir, file);
			if (CommandSet.isExecutable(file)) {
				this.addFromFile(file);
			}
		});
	}

	addFromFile (filename: string): void {
		var basename = path.basename(filename);
		if (process.platform === 'win32') {
			basename = basename.substr(0, basename.lastIndexOf('.'));
		}
		this.addCmd(basename, CommandSet.makeCmd(filename), filename);
	}

	private static makeCmd (filename: string): commandHandler {
		return function (...args: Runnable[]) {
			return new ChildProcessWRapper(filename, args);
		}
	}

	addCmd (name: string, handler: commandHandler, path: string = '[builtin]'): void {
		this.commands[name] = {runner: handler, path: path};
	}

	addAll (commands: {[command: string]: commandHandler}): void {
		Object.keys(commands).forEach((key: string) => {
			this.addCmd(key, commands[key]);
		});
	}

	isCmd (candidate: string): boolean {
		return candidate in this.commands || (this.parent && this.parent.isCmd(candidate));
	}

	getCmdRunnable (name: string, args: Runnable[]): Runnable {
		if (name in this.commands) {
			return this.commands[name].runner(...args);
		} else if (this.parent) {
			return this.parent.getCmdRunnable(name, args);
		}
	}

	getCommandNames (): string[] {
		const names = Object.keys(this.commands);
		if (this.parent) {
			names.push(...this.parent.getCommandNames());
		}
		return names;
	}
}
