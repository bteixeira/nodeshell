import * as fs from 'fs';
import * as cp from 'child_process';

import {Runnable} from '../RunnableWrapperExecuterVisitor';

export default class ChildProcessWrapper implements Runnable {
	private _started = false;
	private _stdio = [];
	private _child;
	private pipes;

	constructor (private _path, private _args) {
	}

	run (callback) {
		var n = 0;
		var waitable = []; // file streams which have to be listened to for the 'open' event before launching the child
						   // process
		this._stdio.forEach(function (stream) {
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
				var child = me._child = cp.spawn(me._path, me._args, {stdio: /*'inherit'*/ me._stdio});
				me._started = true;
				child.on('exit', function (status) {
					callback(status);
				});
				me.pipes = child.stdio;
			}
		}

		verify();
	}

	configFd (fd, config) {
		this._stdio[fd] = config;
	}

	hasConfig (fd) {
		return (typeof this._stdio[fd]) !== 'undefined';
	}
}
