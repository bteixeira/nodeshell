import {Runnable, runnableCallback} from '../runnableWrapperExecuterVisitor';
import {Stream} from 'stream';
import WriteStream = NodeJS.WriteStream;

export default class PipeRunnable implements Runnable {
	pipes = null;

	constructor (
		private left: Runnable,
		private right: Runnable,
	) {}

	run (callback: runnableCallback): void {
		var left = this.left, right = this.right;
		left.configFd(1, 'pipe');
		right.configFd(0, 'pipe');
		left.run(function () {});
		right.run(callback);
		(left.pipes[1] as Stream).pipe(right.pipes[0] as WriteStream);
		this.pipes = [left.pipes[0], right.pipes[1], right.pipes[2]];
	}

	configFd (fd: number, config: Stream): void {
		if (fd === 0) {
			this.left.configFd(fd, config);
		} else if (fd === 1 || fd === 2) {
			this.right.configFd(fd, config);
		}
		// else??
	}

	hasConfig (fd: number): boolean {
		if (fd === 0) {
			return this.left.hasConfig(fd);
		} else if (fd === 1 || fd === 2) {
			return this.right.hasConfig(fd);
		}
		// else??
		return false;
	}
}
