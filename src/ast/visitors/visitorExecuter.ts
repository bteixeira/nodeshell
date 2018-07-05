import * as vm from 'vm';

import * as utils from '../../utils';
import Visitor from './visitor';
import ErrorWrapper from '../../errorWrapper';

// TODO I THINK THIS IS NOT USED
export default class VisitorExecuter extends Visitor {
	constructor (
		private commandSet,
		private context,
	) {
		super();
	}

	visitJS (token, callback) {
		var result;
		try {
			new Function(token.code);
			result = vm.runInContext(token.code, this.context);
		} catch (ex) {
			result = new ErrorWrapper(ex);
		}
		callback(result);
	}

	visitCMD (token, callback) {
		var me = this;
		var argValues = [];
		var error;
		token.args.forEach(function (arg) {
			if (error) {
				return;
			}
			me.visit(arg, function (result) {
				if (result instanceof ErrorWrapper) {
					error = result;
					return;
				}
				argValues.push(result); // FIXME This is not very generic, right now it works because I know that all calls other than CMD are sync
			});
		});
		if (error) {
			callback(error);
		} else {
			this.commandSet.runCmd(token.name, argValues, callback);
		}
	}

	visitLiteral (token, callback) {
		var text = token.text.trim();
		text = utils.expandHomeDir(text);
		callback(text);
	}

	visitERR (token, callback) {
		callback(new ErrorWrapper(token));
	}
}
