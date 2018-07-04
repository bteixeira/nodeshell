import {Runnable} from '../runnableWrapperExecuterVisitor';

export default class Sequence implements Runnable {
	constructor (
		private _left,
		private _right,
	) {}

	run (callback) {
		this._left.run(function noop () {});
		if (this._right) {
			this._right.run(callback);
		} else {
			callback(0);
		}
	}

	hasConfig (fd) {
		if (this._right) {
			return this._right.hasConfig(fd);
		} else {
			return fd === 0 || this._left.hasConfig(fd);
		}
	}

	configFd (fd, stream) {
		if (fd !== 0) {
			this._left.configFd(fd, stream);
		}
		if (this._right) {
			this._right.configFd(fd, stream);
		}
	}
}
