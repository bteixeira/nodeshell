export default class Visitor {
	visit(token) {
		const methodName = `visit${token.type}`;
		const method = this[methodName];
		if (!method) {
			throw new Error(`${this} has no implementation for ${methodName}`);
		}
		return method.apply(this, Array.prototype.slice.call(arguments));
	}
}
