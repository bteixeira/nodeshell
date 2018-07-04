import {Runnable} from '../runnableWrapperExecuterVisitor';
import {Stream} from 'stream';

export default class AndRunnable implements Runnable {
	constructor (
		private left,
		private right,
	) {}

	run (callback): void {
		this.left.run((status: number) => {
			if (status === 0) {
				this.right.run(callback);
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

//p.redirOutput = function (fd, to) {
//    this._left.redirOutput(fd, to);
//    this._right.redirOutput(fd, to);
//};
//
//p.redirInput = function (fd, from) {
//    this._left.redirInput(fd, from);
//    this._right.redirInput(fd, from);
//};
//
//p.hasOutput = function (fd) {
//    return this._left.hasOutput(fd) || this._right.hasOutput(fd);
//};
//
//p.hasInput = function (fd) {
//    return this._left.hasInput(fd) || this._right.hasInput(fd);
//};
