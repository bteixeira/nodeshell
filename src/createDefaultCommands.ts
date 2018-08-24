import * as util from 'util';
import {Context} from 'vm';

import CommandSet, {commandHandler} from './commandSet';
import ErrorWrapper from './errorWrapper';
import FunctionRunnable from './parser/runnables/functionRunnable';
import * as utils from './utils';
import {Runnable} from './parser/runnables/runnable'

export default function (context: Context) {

	var commands = new CommandSet();

	const builtins: {[command: string]: commandHandler} = {
		cd: cd,
		// stub: stub,
		// exit: exit,
		all: function (...args: Runnable[]) {
			return new FunctionRunnable(function (stdio) {
				commands.getCommandNames().forEach(function (command) {
					stdio[1].write(command + '\n');
				});
			});
		},
		// TODO IF THIS COMMAND IS STILL NEEDED THEN PORT THE ARGS TO USE RUNNABLES
		// source: function (args: string[]) {
		// 	var filename = args.length && args[0];
		// 	return new FunctionRunnable(function (stdio) {
		// 		return utils.sourceSync(filename, context);
		// 	});
		// },
	};
	Object.keys(builtins).forEach((key: string) => {
		commands.addCmd(key, builtins[key]);
	});
	return commands;
};

var cd = (function () {
	var previousDir: string = process.cwd();
	return function cd (...args: Runnable[]) {
		return new FunctionRunnable(function (stdio) {
			var m = args.length;
			const argValues: any[] = []; // TODO CONFIRM ANY

			/* All arguments are executed even if only the first result is used */
			args.forEach((arg: Runnable) => {
				arg.run(result => {
					m -= 1;
					if (result instanceof Array) { // TODO TEST ARRAY
						argValues.push(...result);
					} else {
						argValues.push(result); // TODO MAYBE THE TWO ARE EQUIVALENT
					}
					verify();
				});
			});

			function verify () {
				if (m === 0) {
					var dir = argValues[0] || utils.getUserHome();
					if (dir === '-') {
						dir = previousDir;
					}
					try {
						var tmp = process.cwd();
						process.chdir(dir);
						/* We postpone updating `previousDir` because `chdir` may throw */
						previousDir = tmp;
					} catch (ex) {
						return new ErrorWrapper(ex);
					}
				}
			}

			if (args.length === 0) {
				verify();
			}
		});
	};
}());

// TODO NEED TO PORT THESE TO USE RUNNABLE ARGUMENTS
// function stub (args: string[]) {
// 	return new FunctionRunnable(function (stdio) {
// 		stdio[1].write('This is simply a stub command.\n');
// 		stdio[1].write('You gave me these arguments:\n' + util.inspect(args) + '\n');
// 	});
// }
//
// function exit (args: string[]) {
// 	var status = args[0];
// 	return new FunctionRunnable(function (stdio) {
// 		process.exit(Number(status));
// 	});
// }
