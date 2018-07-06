import LineReader from './lineReader';

class History {
	private index: number;
	private lineStack: string[];
	private lineReader: LineReader;

	constructor (lineReader: LineReader) {
		this.index = -1;
		this.lineStack = [];
		this.lineReader = lineReader;
	}

	prev (): void {
		if (this.index < 0 && this.lineReader.getLine()) {
			this.push();
			this.index = 0;
		}
		this.index = Math.min(this.lineStack.length - 1, this.index + 1);
		const line: string = this.lineStack[this.index];
		if (line) {
			this.lineReader.setLine(line).refreshLine();
		}
	}

	next (): void {
		if (this.index < 0 && this.lineReader.getLine()) {
			this.push();
			this.lineReader.deleteLine();
		} else {
			this.index = Math.max(-1, this.index - 1);
			this.lineReader.setLine(this.lineStack[this.index] || '').refreshLine();
		}
	}

	push (): void {
		const line: string = this.lineReader.getLine().trim();
		if (line) {
			this.lineStack.unshift(line);
		}
	}

	rewind (): void {
		this.index = -1;
	}
}

export default History;
