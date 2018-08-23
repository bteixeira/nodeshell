import {Stream} from 'stream';

import {Runnable, runnableCallback} from './runnable'

export default class OrRunnable implements Runnable {
	constructor (
		private left: Runnable,
		private right: Runnable,
	) {}

	run (callback: runnableCallback): void {
		this.left.run(function (status) {
			if (status !== 0) {
				this.right.run(callback);
			} else {
				callback(status);
			}
		})
	}

	hasConfig (fd: number): boolean {
		throw new Error('Method not implemented');
		return false;
	}

	configFd (config: number, stream: Stream): void {
		throw new Error('Method not implemented');
	}
}
