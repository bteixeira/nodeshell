import {Stream} from 'stream';
import {ChildProcess} from 'child_process';
import * as fs from 'fs';
import * as cp from 'child_process';

import {Runnable, runnableCallback} from '../runnableWrapperExecuterVisitor';

export default class ChildProcessWrapper implements Runnable {
	private started = false;
	private stdio: Stream[] = [];
	private child: ChildProcess;

	pipes = null;

	constructor (
		private path: string,
		private args: Runnable[],
	) {}

	run (callback: runnableCallback): void {
		const me = this;
		var n = 0;
		var m = this.args.length;
		var waitable: Stream[] = []; // file streams which have to be listened to for the 'open' event before launching the child
						   // process
		this.stdio.forEach(function (stream) {
			if (stream.constructor === fs.ReadStream || stream.constructor === fs.WriteStream) {
				waitable.push(stream);
				stream.on('open', function () {
					n++;
					verify()
				});
			}
		});

		const argValues: any[] = []; // TODO CONFIRM ANY

		this.args.forEach((arg: Runnable) => {
			arg.run(result => {
				m -= 1;
				if (result.length) { // TODO TEST ARRAY
					argValues.push(...result);
				} else {
					argValues.push(result); // TODO MAYBE THE TWO ARE EQUIVALENT
				}
				verify();
			});
		});

		function verify () {
			if (n === waitable.length && m === 0 && !me.child) {
				var child = me.child = cp.spawn(me.path, argValues, {stdio: /*'inherit'*/ me.stdio});
				me.started = true;
				child.on('exit', (status: number) => {
					callback(status);
				});
				me.pipes = child.stdio;
			}
		}

		verify();
	}

	configFd (fd: number, config: Stream): void {
		this.stdio[fd] = config;
	}

	hasConfig (fd: number): boolean {
		return (typeof this.stdio[fd]) !== 'undefined';
	}
}
