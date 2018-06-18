class History {
	index: number;
	stack: any[];
	lineReader: any;

	constructor(lineReader) {
		this.index = -1;
		this.stack = [];
		this.lineReader = lineReader;
	}

	prev(): void {
		if (this.index < 0 && this.lineReader.getLine()) {
			this.push();
			this.index = 0;
		}
		this.index = Math.min(this.stack.length - 1, this.index + 1);
		const item = this.stack[this.index];
		if (item) {
			this.lineReader.setLine(item).refreshLine();
		}
	}

	next(): void {
		if (this.index < 0 && this.lineReader.getLine()) {
			this.push();
			this.lineReader.deleteLine();
		} else {
			this.index = Math.max(-1, this.index - 1);
			this.lineReader.setLine(this.stack[this.index] || '').refreshLine();
		}
	}

	push(): void {
		const line = this.lineReader.getLine().trim();
		if (line) {
			this.stack.unshift(line);
		}
	}

	rewind(): void {
		this.index = -1;
	}
}

export default History;
