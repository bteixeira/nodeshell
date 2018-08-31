import {Stream} from 'stream';
import {executionCallback} from './ast/visitors/executerVisitor';
import {ReadStream, WriteStream} from 'fs';
import * as cp from 'child_process';

export default function runProcess(
	path: string,
	args: string[],
	streams: Stream[],
	callback: executionCallback
) {
	var n = 0;
	streams.forEach(stream => {
		if (stream instanceof ReadStream || stream instanceof WriteStream) {
			n += 1;
			stream.on('open', function () {
				n -= 1;
				verify()
			});
		}
	});

	// TODO USE PROMISES INSTEAD OF MANUAL MANAGEMENT

	var running: boolean = false;

	function verify() {
		if (n === 0 && !running) {
			running = true;
			const child = cp.spawn(
				path,
				args,
				{
					stdio: streams,
				},
			);
			child.on('exit', (status: number) => {
				callback(status);
			});
			// me.pipes = child.stdio; // TODO ?!?!?!?!?!? WHY WAS THIS HERE?
		}
	}

	verify();
}
