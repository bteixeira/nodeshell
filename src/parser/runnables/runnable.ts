import {fdConfig} from '../runnableWrapperExecuterVisitor'

export type runnableCallback = (result: any) => void;

export interface Runnable {
	pipes?: fdConfig[];

	hasConfig: (fd: number) => boolean;
	configFd: (fd: number, stream: fdConfig) => void;
	run: (callback: runnableCallback) => void;
}
