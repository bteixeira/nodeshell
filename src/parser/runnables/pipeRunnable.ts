import {fdConfig} from '../runnableWrapperExecuterVisitor';
import {Stream} from 'stream';
import WriteStream = NodeJS.WriteStream;
import {Runnable, runnableCallback} from './runnable'

export default class PipeRunnable implements Runnable {
	pipes?: fdConfig[];

	constructor (
		private left: Runnable,
		private right: Runnable,
	) {}

	run (callback: runnableCallback): void {
		this.left.configFd(1, 'pipe');
		this.right.configFd(0, 'pipe');
		this.left.run(function () {});
		this.right.run(callback);
		(this.left.pipes[1] as Stream).pipe(this.right.pipes[0] as WriteStream);
		this.pipes = [this.left.pipes[0], this.right.pipes[1], this.right.pipes[2]];
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
