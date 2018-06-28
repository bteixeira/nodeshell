var fs = require('fs');
var path = require('path');

var utils = require('./utils');
var CPWrapper = require('./parser/runners/cpWrapper');
var spawn = require('child_process').spawn;

export default class Commands {
	public commands: any;
	private parent: Commands;

	constructor(options?) {

		options = options || {};

		this.commands = {};

		if (!options.skipPath) {
			this.addFromPath();
		}

		if (options.parent) {
			this.parent = options.parent;
		}
	}

	private static isExecutable(file) {
		if (process.platform === 'win32') {
			return /\.(exe|bat)$/.test(file);
		}
		try {
			var stat = fs.statSync(file);
		} catch (ex) {
			/* Broken symlink will throw this */
			return false;
		}
		return (stat && (stat.mode & 0o111)); // test for *any* of the execute bits
	}

	addFromPath(path_?: string) {
		var me = this;
		path_ = path_ || process.env.PATH;
		var paths = path_.split(path.delimiter);
		paths.forEach(function (dir) {
			me.addFromDir(dir)
		});
	}

	addFromDir(dir) {
		var me = this;
		var files;
		try {
			files = fs.readdirSync(dir);
		} catch (ex) {
			/* Probably directory in PATH that doesn't exist */
			return;
		}
		files.forEach(function (file) {
			file = path.resolve(dir, file);
			if (Commands.isExecutable(file)) {
				me.addFromFile(file);
			}
		});
	}

	addFromFile(filename) {
		var basename = path.basename(filename);
		if (process.platform === 'win32') {
			basename = basename.substr(0, basename.lastIndexOf('.'));
		}
		this.addCommand(basename, Commands.makeCmd(filename), filename);
	}

	private static makeCmd(filename) {
		return function (args) {
			return new CPWrapper(filename, args);
		}
	}

	addCommand(name, body, path: string = '[builtin]') {
		this.commands[name] = {runner: body, path: path};
	}

	isCmd(candidate) {
		return candidate in this.commands || (this.parent && this.parent.isCmd(candidate));
	}

	getCmd(name, args) {
		if (name in this.commands) {
			return this.commands[name].runner(args);
		} else if (this.parent) {
			return this.parent.getCmd(name, args);
		}
	}

	getCommandNames() {
		var names = Object.keys(this.commands);
		if (this.parent) {
			Array.prototype.push.apply(names, this.parent.getCommandNames());
		}
		return names;
	}
}
