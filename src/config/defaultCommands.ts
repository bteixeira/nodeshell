import CommandSet, {xxxCommandThing} from '../commandSet';
import * as utils from '../utils';
import WriteStream = NodeJS.WriteStream;
import {Stream} from 'stream'
import {executionCallback} from '../ast/visitors/executerVisitor'

export default function () {
	const commands = new CommandSet();
	commands.addFromPath(process.env.PATH);
	commands.addAll({
		cd: cd,
		// stub: stub,
		// exit: exit,
		all: function (args: string[], streams, callback) {
			commands.getCommandNames().forEach((command: string) => {
				(streams[1] as WriteStream).write(command + '\n');
			});
			callback(undefined); // TODO STREAM MIGHT NOT HAVE BEEN FLUSHED YET
		},
		// TODO IF THIS COMMAND IS STILL NEEDED THEN PORT THE ARGS TO USE RUNNABLES
		// source: function (args: string[]) {
		// 	var filename = args.length && args[0];
		// 	return new FunctionRunnable(function (stdio) {
		// 		return utils.sourceSync(filename, context);
		// 	});
		// },
	});
	return commands;
};

const cd = (function () {
	var previousDir: string = process.cwd();
	return function cd (args: string[], streams: Stream[], callback: executionCallback) {
		var dir: string = args[0] || utils.getUserHome();
		if (dir === '-') {
			dir = previousDir;
		}
		try {
			var tmp = process.cwd();
			process.chdir(dir);
			previousDir = tmp;
			callback(undefined); /* undefined, could also return 0 to comply with bash */
		} catch (ex) {
			callback(new Error(ex));
		}
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
