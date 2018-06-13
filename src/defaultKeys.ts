import readline = require('readline');
import {EventEmitter} from 'events';

module.exports = function (keyHandler, lineReader, history, complete) {

	keyHandler.bindDefault(function (ch, key) {
		if (ch && ch.length === 1) {
			lineReader.insert(ch);
		}
	});

	keyHandler.bind(['LEFT', 'CTRL+B'], function () {
		lineReader.moveLeft();
	});
	keyHandler.bind(['RIGHT', 'CTRL+F'], function () {
		lineReader.moveRight();
	});
	keyHandler.bind(['HOME', 'CTRL+A'], function () {
		lineReader.moveToStart();
	});
	keyHandler.bind(['END', 'CTRL+E'], function () {
		lineReader.moveToEnd();
	});
	keyHandler.bind(['CTRL+LEFT', 'ALT+B'], function () {
		lineReader.moveWordLeft();
	});
	keyHandler.bind(['CTRL+RIGHT', 'ALT+F'], function () {
		lineReader.moveWordRight();
	});

	keyHandler.bind(['BACKSPACE', 'CTRL+H'], function () {
		lineReader.deleteLeft();
	});
	keyHandler.bind('DELETE', function () {
		lineReader.deleteRight();
	});
	keyHandler.bind(['CTRL+W', 'CTRL+BACKSPACE', 'ALT+BACKSPACE'], function () {
		lineReader.deleteWordLeft();
	});
	keyHandler.bind(['CTRL+DEL', 'ALT+D', 'ALT+DELETE'], function () {
		lineReader.deleteWordRight();
	});
	keyHandler.bind(['CTRL+SHIFT+DEL', 'CTRL+K'], function () {
		lineReader.deleteLineRight();
	});
	keyHandler.bind('CTRL+U', function () {
		lineReader.deleteLine();
	});

	keyHandler.bind(['CTRL+C'], function () {
		process.kill(process.pid, 'SIGINT'); // Trigger SIGINT and let listeners do something about it
	});
	keyHandler.bind(['CTRL+D'], function () {
		if (lineReader.isEmpty()) {
			process.stdout.write('\n');
			readline.clearScreenDown(process.stdout);
			process.exit();
		}
	});

	keyHandler.bind(['UP', 'CTRL+P'], function () {
		history.prev();
	});
	keyHandler.bind(['DOWN', 'CTRL+N'], function () {
		history.next();
	});

	keyHandler.bind('TAB', function () {
		complete();
	});

	keyHandler.bind('CTRL+L', function () {
		readline.cursorTo(lineReader.output, 0, 0);
		readline.clearScreenDown(lineReader.output);
		lineReader.refreshLine();
	});

	keyHandler.bind('RETURN', function () {
		history.push();
		history.rewind();
		lineReader.accept();
	});

	keyHandler.bind('CTRL+Z', function () {
	});
};