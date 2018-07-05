import Visitor from './visitor';

function print (indent, msg) {
	console.log(new Array(indent + 1).join('\t') + msg);
}

// TODO SEEMS TO BE FOR TESTING ONLY
export default class VisitorPrinter extends Visitor {
	private indent: number = 0;

	log (msg) {
		print(this.indent, msg);
	}

	visitJS (token) {
		this.log('JS FRAGMENT: ' + token.code);
	}

	visitCMD (token) {
		this.log('CMD (' + token.args.length + ' args): ' + token.name);
		this.indent += 1;
		var me = this;
		token.args.forEach(function (arg) {
			me.visit(arg);
		});
		this.indent -= 1;
	}

	visitLiteral (token) {
		this.log('LITERAL: ' + token.text);
	}

	visitERR (token) {
		this.log('ERROR: ' + token.msg + ', at column ' + token.pos + ' "' + token.char + '"');
	}
}
