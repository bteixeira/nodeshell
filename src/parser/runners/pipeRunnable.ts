import {Runnable} from '../runnableWrapperExecuterVisitor';

export default class PipeRunnable implements Runnable {
	private pipes;

	constructor (
		private _left,
		private _right,
	) {}

	run (callback) {
		var left = this._left, right = this._right;
		left.configFd(1, 'pipe');
		right.configFd(0, 'pipe');
		left.run(function () {});
		right.run(callback);
		left.pipes[1].pipe(right.pipes[0]);
		this.pipes = [left.pipes[0], right.pipes[1], right.pipes[2]];
	}

	configFd (fd, config) {
		if (fd === 0) {
			this._left.configFd(fd, config);
		} else if (fd === 1 || fd === 2) {
			this._right.configFd(fd, config);
		}
		// else??
	}

	hasConfig (fd) {
		if (fd === 0) {
			return this._left.hasConfig(fd);
		} else if (fd === 1 || fd === 2) {
			return this._right.hasConfig(fd);
		}
		// else??
		return false;
	}
}
