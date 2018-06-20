import * as readline from 'readline';
import {Panel} from '../composer';

export default class CenterFooterLayout implements Panel {
	constructor(private center, private footer, private stdout) {
		center.setParent(this);
		if (footer) {
			footer.setParent(this);
		}
	}

	getChildOffsetV(child) {
		return 0;
	}
	getChildOffsetH(child) {
		return 0;
	}
	getChildOffset(child) {
		return [this.getChildOffsetV(child), this.getChildOffsetH(child)];
	}
	getChildWidth(child) {
		return this.stdout.columns;
	}
	getSpaceBelowChild(child) {
		if (child === this.center && this.footer) {
			return this.footer.getHeight();
		} else {
			return 0;
		}
	}
	isFooter(child) {
		return (child === this.footer);
	}
	reserveSpace() {
		var totalHeight = this.center.getHeight();
		if (this.footer) {
			totalHeight += this.footer.getHeight();
		}
		this.stdout.write(new Array(totalHeight).join('\n'));
		readline.moveCursor(this.stdout, 0, -totalHeight + 1);
	}
	redrawBelowChild(child) {
		if (child === this.center && this.footer) {
			this.footer.rewrite();
		}
	}
	rewrite() {
		this.center.rewrite();
		if (this.footer) {
			this.footer.rewrite();
		}
	}

	reset() {
		this.center.reset();
		if (this.footer) {
			this.footer.reset();
		}
	}
}
