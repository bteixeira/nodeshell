export default class ErrorWrapper {
	public err: boolean = true;

	constructor (private error: any) {}

	toString = function () {
		return this.error.toString();
	}
}
