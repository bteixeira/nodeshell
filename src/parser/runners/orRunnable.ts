import {Stream} from 'stream';

import {Runnable} from '../runnableWrapperExecuterVisitor';

export default class OrRunnable implements Runnable {
	constructor (
		private _left,
		private _right
	) {}

	run (callback) {
		this._left.run(function (status) {
			if (status !== 0) {
				this._right.run(callback);
			} else {
				callback(status);
			}
		})
	}

	hasConfig (config: number): boolean {
		throw new Error('Method not implemented');
		return false;
	}

	configFd (config: number, stream: Stream): void {
		throw new Error('Method not implemented');
	}
}
