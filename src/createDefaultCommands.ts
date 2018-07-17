import * as util from 'util';
import {Context} from 'vm';

import Commands from './commands';
import ErrorWrapper from './errorWrapper';
import FunctionRunnable from './parser/runners/functionRunnable';
import * as utils from './utils';

export default function (context: Context) {

	var commands = new Commands();

	var builtins = {
		cd: cd,
		stub: stub,
		exit: exit,
		all: function (args: string[]) {
			return new FunctionRunnable(function (stdio) {
				commands.getCommandNames().forEach(function (command) {
					stdio[1].write(command + '\n');
				});

			});
		},
		source: function (args: string[]) {
			var filename = args.length && args[0];
			return new FunctionRunnable(function (stdio) {
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
	return function cd (args: string[]) {
		var dir = args[0] || utils.getUserHome();
		if (dir === '-') {
			dir = previous;
		}
		return new FunctionRunnable(function (stdio) {
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
	return new FunctionRunnable(function (stdio) {
		stdio[1].write('This is simply a stub command.\n');
		stdio[1].write('You gave me these arguments:\n' + util.inspect(args) + '\n');
	});
}

function exit (args: string[]) {
	var status = args[0];
	return new FunctionRunnable(function (stdio) {
		process.exit(Number(status));
	});
}
