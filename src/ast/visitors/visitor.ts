import {DescentParserNode} from '../nodes/descentParserNodes';
import {Runnable} from '../../parser/runnables/runnable'

type visitorMethod = (node: DescentParserNode) => Runnable;

export default class Visitor {
	visit (node: DescentParserNode) {
		const methodName: string = `visit${node.type}`;
		const method: visitorMethod = this[methodName];
		if (!method) {
			throw new Error(`${this} has no implementation for ${methodName}`);
		}
		return method.apply(this, Array.prototype.slice.call(arguments));
	}
	// [key: string]: visitorMethod // Will break if methods with a different signature are added
}
