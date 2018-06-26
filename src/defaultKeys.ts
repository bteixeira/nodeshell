import * as readline from 'readline';
import KeyHandler from './keyhandler';
import History from './history';
import LineReader from './lineReader';

module.exports = function (keyHandler: KeyHandler, lineReader: LineReader, history: History, complete: () => void) {

	keyHandler.bindDefault((ch: string, key) => {
		if (ch && ch.length === 1) {
			lineReader.insert(ch);
		}
	});

	keyHandler.bind(['LEFT', 'CTRL+B'], () => {
		lineReader.moveLeft();
	});
	keyHandler.bind(['RIGHT', 'CTRL+F'], () => {
		lineReader.moveRight();
	});
	keyHandler.bind(['HOME', 'CTRL+A'], () => {
		lineReader.moveToStart();
	});
	keyHandler.bind(['END', 'CTRL+E'], () => {
		lineReader.moveToEnd();
	});
	keyHandler.bind(['CTRL+LEFT', 'ALT+B'], () => {
		lineReader.moveWordLeft();
	});
	keyHandler.bind(['CTRL+RIGHT', 'ALT+F'], () => {
		lineReader.moveWordRight();
	});

	keyHandler.bind(['BACKSPACE', 'CTRL+H'], () => {
		lineReader.deleteLeft();
	});
	keyHandler.bind(['DELETE'], () => {
		lineReader.deleteRight();
	});
	keyHandler.bind(['CTRL+W', 'CTRL+BACKSPACE', 'ALT+BACKSPACE'], () => {
		lineReader.deleteWordLeft();
	});
	keyHandler.bind(['CTRL+DEL', 'ALT+D', 'ALT+DELETE'], () => {
		lineReader.deleteWordRight();
	});
	keyHandler.bind(['CTRL+SHIFT+DEL', 'CTRL+K'], () => {
		lineReader.deleteLineRight();
	});
	keyHandler.bind(['CTRL+U'], () => {
		lineReader.deleteLine();
	});

	keyHandler.bind(['CTRL+C'], () => {
		process.kill(process.pid, 'SIGINT'); // Trigger SIGINT and let listeners do something about it
	});
	keyHandler.bind(['CTRL+D'], () => {
		if (lineReader.isEmpty()) {
			process.stdout.write('\n');
			readline.clearScreenDown(process.stdout);
			process.exit();
		}
	});

	keyHandler.bind(['UP', 'CTRL+P'], () => {
		history.prev();
	});
	keyHandler.bind(['DOWN', 'CTRL+N'], () => {
		history.next();
	});

	keyHandler.bind(['TAB'], () => {
		complete();
	});

	keyHandler.bind(['CTRL+L'], () => {
		readline.cursorTo(process.stdout, 0, 0);
		readline.clearScreenDown(process.stdout);
		lineReader.refreshLine();
	});

	keyHandler.bind(['RETURN'], () => {
		history.push();
		history.rewind();
		lineReader.accept();
	});

	keyHandler.bind(['CTRL+Z'], () => {
	});
};