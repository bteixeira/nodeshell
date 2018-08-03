import {Runnable, runnableCallback} from '../runnableWrapperExecuterVisitor';
import {Stream} from 'stream';

export default class ValueRunnable<T> implements Runnable {
	constructor (
		private value: T,
	) {}

	run (callback: runnableCallback): void {
		callback(this.value)
	}

	hasConfig (fd: number): boolean {
		return false
	}

	configFd (fd: number, stream: Stream): void {}
}
