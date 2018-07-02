import * as util from 'util';
import {Context} from 'vm';

import Commands from './commands';
import ErrorWrapper from './errorWrapper';
import * as utils from './utils';

const FunRunner = require('./parser/runners/FunRunner');

export default function (context: Context) {

	var commands = new Commands();

	var builtins = {
		cd: cd,
		stub: stub,
		exit: exit,
		all: function (args) {
			return new FunRunner(function (stdio) {
				commands.getCommandNames().forEach(function (command) {
					stdio[1].write(command + '\n');
				});

			});
		},
		source: function (args) {
			var filename = args.length && args[0];
			return new FunRunner(function (stdio) {
				return utils.sourceSync(filename, context);
			});
		},
	};
	for (var p in  builtins) {
		if (builtins.hasOwnProperty(p)) {
			commands.addCommand(p, builtins[p]);
		}
	}

	return commands;

};

var cd = (function () {
	var previous = process.cwd();
	return function cd (args) {
		var dir = args[0] || utils.getUserHome();
		if (dir === '-') {
			dir = previous;
		}
		return new FunRunner(function (stdio) {
			try {
				var tmp = process.cwd();
				process.chdir(dir);
				previous = tmp;
			} catch (ex) {
				return new ErrorWrapper(ex);
			}
		});
	};
}());

function stub (args: string[]) {
	return new FunRunner(function (stdio) {
		stdio[1].write('This is simply a stub command.\n');
		stdio[1].write('You gave me these arguments:\n' + util.inspect(args) + '\n');
	});
}

function exit (args) {
	var status = args[0];
	return new FunRunner(function (stdio) {
		process.exit(status);
	});
}
