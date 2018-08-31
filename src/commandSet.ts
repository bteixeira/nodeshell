import * as fs from 'fs';
import {Stats} from 'fs';
import * as path from 'path';
import {executionCallback} from "./ast/visitors/executerVisitor";
import {Stream} from "stream";
import tmpChildProcessRunner from "./runProcess";

export type xxxCommandThing = (args: string[], streams: Stream[], callback: executionCallback) => void;
export type commandSpec = {
	run: xxxCommandThing;
	path: string;
};

/**
 * Keeps track of available commands by name.
 */
export default class CommandSet {
	public commands: {[name: string]: commandSpec} = {};

	constructor (private parent?: CommandSet) {
	}

	private static isExecutable (file: string): boolean {
		var stat: Stats;
		if (process.platform === 'win32') {
			return /\.(exe|bat)$/.test(file);
		}
		try {
			stat = fs.statSync(file);
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

	private static makeCmd (filename: string): xxxCommandThing {
		return function (args: string[], streams, callback) {
			tmpChildProcessRunner(filename, args, streams, callback);
		}
	}

	runCmd (name: string, args: string[], streams: Stream[], callback: executionCallback): void {
		if (name in this.commands) {
			this.commands[name].run(args, streams, callback);
		} else if (this.parent) {
			this.parent.runCmd(name, args, streams, callback);
		} else {
			throw new Error(`Unknown command "${name}"`);
		}

	}

	addCmd (name: string, handler: xxxCommandThing, path: string = '[builtin]'): void {
		this.commands[name] = {run: handler, path};
	}

	addAll (commands: {[command: string]: xxxCommandThing}): void {
		Object.keys(commands).forEach((key: string) => {
			this.addCmd(key, commands[key]);
		});
	}

	isCmd (candidate: string): boolean {
		return candidate in this.commands || (this.parent && this.parent.isCmd(candidate));
	}

	getCommandNames (): string[] {
		const names = Object.keys(this.commands);
		if (this.parent) {
			names.push(...this.parent.getCommandNames());
		}
		return names;
	}
}
