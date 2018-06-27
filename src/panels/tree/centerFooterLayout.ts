import * as readline from 'readline';
import {Panel} from '../composer';
import {WriteStream} from 'tty';

export default class CenterFooterLayout implements Panel {
	constructor(
		private center: Panel,
		private footer: Panel,
		private stdout: WriteStream
	) {
		center.setParent(this);
		if (footer) {
			footer.setParent(this);
		}
	}

	getChildOffsetV(child: Panel): number {
		return 0;
	}
	getChildOffsetH(child: Panel): number {
		return 0;
	}
	getChildOffset(child: Panel): [number, number] {
		return [this.getChildOffsetV(child), this.getChildOffsetH(child)];
	}
	getChildWidth(child: Panel): number {
		return this.stdout.columns;
	}
	getSpaceBelowChild(child: Panel): number {
		if (child === this.center && this.footer) {
			return this.footer.getHeight();
		} else {
			return 0;
		}
	}
	isFooter(child: Panel): boolean {
		return (child === this.footer);
	}
	reserveSpace(): void {
		var totalHeight: number = this.center.getHeight();
		if (this.footer) {
			totalHeight += this.footer.getHeight();
		}
		this.stdout.write(new Array(totalHeight).join('\n'));
		readline.moveCursor(this.stdout, 0, -totalHeight + 1);
	}
	redrawBelowChild(child: Panel): void {
		if (child === this.center && this.footer) {
			this.footer.rewrite();
		}
	}
	rewrite(): void {
		this.center.rewrite();
		if (this.footer) {
			this.footer.rewrite();
		}
	}

	reset(): void {
		this.center.reset();
		if (this.footer) {
			this.footer.reset();
		}
	}

	setParent(parent: Panel): void {
		throw new Error('This panel should not need a parent');
	}

	getHeight(): number {
		throw new Error('Not implemented');
		return -1;
	}
}
