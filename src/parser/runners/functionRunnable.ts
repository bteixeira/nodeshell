import {Runnable} from '../runnableWrapperExecuterVisitor';
import {Stream} from 'stream';

export default class FunctionRunnable implements Runnable {
	private _stdio: (Stream | 'pipe')[] = [];
	private pipes;

	constructor (private _fun) {
	}

	run (cb) {
		// todo piping
		var me = this;
		this.pipes = [];
		this._stdio.forEach((cfg, i: number) => {
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
			result = me._fun(me.pipes);
			/* close open streams, otherwise piped processes hang */
			me.pipes.forEach(function (pipe) {
				if (
					pipe !== process.stdout &&
					pipe !== process.stderr &&
					pipe !== process.stdin &&
					pipe.end
				) {
					pipe.end();
				}
			});
			cb(result);
		}, 0);
	}

	hasConfig (fd: number): boolean {
		return typeof this._stdio[fd] !== 'undefined';
	}

	configFd (fd: number, config: Stream): void {
		this._stdio[fd] = config;
	}

}
