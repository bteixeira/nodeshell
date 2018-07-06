export default class ErrorWrapper {
	public err: boolean = true;

	constructor (private error) {
	}

	toString = function () {
		return this.error.toString();
	}
}
