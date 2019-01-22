import {DescentParserNode} from '../nodes/descentParserNodes';

type visitorMethod = (node: DescentParserNode) => void;

export default abstract class Visitor {
	protected dispatch (node: DescentParserNode, ...moreArgs: any[]) {
		var method: visitorMethod;

		switch (node.type) {
			case 'REDIR': method = this.visitREDIR; break;
			case 'COMMAND': method = this.visitCOMMAND; break;
			case 'PIPELINE': method = this.visitPIPELINE; break;
			case 'AND_LIST': method = this.visitAND_LIST; break;
			case 'OR_LIST': method = this.visitOR_LIST; break;
			case 'SEQUENCE': method = this.visitSEQUENCE; break;
			case 'GLOB': method = this.visitGLOB; break;
			case 'JS': method = this.visitJS; break;
			case 'DQSTRING': method = this.visitDQSTRING; break;
			case 'ERROR': method = this.visitERROR; break;
		}

		if (!method) {
			throw new Error(`${this} has no implementation for ${node.type}`);
		}

		return method.call(this, node, ...moreArgs);
	}

	abstract visitREDIR (node: DescentParserNode, ...moreArgs: any[]): void;

	abstract visitCOMMAND (node: DescentParserNode, ...moreArgs: any[]): void;

	abstract visitPIPELINE (node: DescentParserNode, ...moreArgs: any[]): void;

	abstract visitAND_LIST (node: DescentParserNode, ...moreArgs: any[]): void;

	abstract visitOR_LIST (node: DescentParserNode, ...moreArgs: any[]): void;

	abstract visitSEQUENCE (node: DescentParserNode, ...moreArgs: any[]): void;

	abstract visitGLOB (node: DescentParserNode, ...moreArgs: any[]): void;

	abstract visitJS (node: DescentParserNode, ...moreArgs: any[]): void;

	abstract visitDQSTRING (node: DescentParserNode, ...moreArgs: any[]): void;

	abstract visitERROR (node: DescentParserNode, ...moreArgs: any[]): void;
}
