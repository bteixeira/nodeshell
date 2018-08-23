import {Runnable, runnableCallback} from './runnable'
import {Stream} from 'stream';

export default class Sequence implements Runnable {
	constructor (
		private _left: Runnable,
		private _right: Runnable,
	) {}

	run (callback: runnableCallback): void {
		this._left.run(function noop () {});
		if (this._right) {
			this._right.run(callback);
		} else {
			callback(0);
		}
	}

	hasConfig (fd: number): boolean {
		if (this._right) {
			return this._right.hasConfig(fd);
		} else {
			return fd === 0 || this._left.hasConfig(fd);
		}
	}

	configFd (fd: number, stream: Stream): void {
		if (fd !== 0) {
			this._left.configFd(fd, stream);
		}
		if (this._right) {
			this._right.configFd(fd, stream);
		}
	}
}
