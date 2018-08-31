import {DescentParserNode} from '../nodes/descentParserNodes';

type visitorMethod = (node: DescentParserNode) => void;

export default class Visitor {
	dispatch (node: DescentParserNode, ...moreArgs: any[]) {
		const methodName: string = `visit${node.type}`;
		const method: visitorMethod = this[methodName];
		if (!method) {
			throw new Error(`${this} has no implementation for ${methodName}`);
		}
		return method.call(this, node, ...moreArgs);
	}
	// [key: string]: visitorMethod // Will break if methods with a different signature are added
}
