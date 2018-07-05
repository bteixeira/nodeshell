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
		private args: string[],
	) {}

	run (callback: runnableCallback): void {
		var n = 0;
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

		var me = this;

		function verify () {
			if (n === waitable.length) {
				var child = me.child = cp.spawn(me.path, me.args, {stdio: /*'inherit'*/ me.stdio});
				me.started = true;
				child.on('exit', function (status) {
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
