import {fdConfig, Runnable, runnableCallback} from '../runnableWrapperExecuterVisitor';
import {Duplex, Stream, Writable} from 'stream';

export default class FunctionRunnable implements Runnable {
	private stdio: (Stream | 'pipe')[] = [];
	pipes = null;

	constructor (private fun: (stdio: Duplex[]) => void) {}

	run (cb: runnableCallback): void {
		// todo piping
		var me = this;
		this.pipes = [];
		this.stdio.forEach((cfg, i: number) => {
			if (cfg === 'pipe') {
				this.pipes[i] = (function () {
					var j = i;
					return {
						pipe: function (target) {
							me.pipes[j] = target;
						},
					};
				}());
			} else {
				this.pipes[i] = cfg;
			}
		});
		var result;
		setTimeout(() => {
			result = me.fun(me.pipes);
			/* close open streams, otherwise piped processes hang */
			me.pipes.forEach((pipe: Stream) => {
				if (
					pipe !== process.stdout &&
					pipe !== process.stderr &&
					pipe !== process.stdin &&
					pipe instanceof Writable
				) {
					(pipe as Writable).end();
				}
			});
			cb(result);
		}, 0);
	}

	hasConfig (fd: number): boolean {
		return typeof this.stdio[fd] !== 'undefined';
	}

	configFd (fd: number, config: Stream): void {
		this.stdio[fd] = config;
	}

}
