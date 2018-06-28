import Panel from './panel';

export default class RowsLayout implements Panel {
	private parent: Panel;

	constructor(private children) {
		children.forEach(child => {
			child.setParent(this);
		});
	}

	getChildOffsetV(child: Panel): number {
		var i: number;
		var sum: number = 0;

		// TODO REPLACE WITH Array.reduce()
		for (i = 0; this.children[i] !== child && i < this.children.length; i++) {
			sum += this.children[i].getHeight();
		}
		return sum + this.parent.getChildOffsetV(this);
	}

	getChildOffsetH(child: Panel): number {
		return this.parent.getChildOffsetH(this);
	}

	getChildOffset(child): [number, number] {
		return [this.getChildOffsetV(child), this.getChildOffsetH(child)];
	}

	getChildWidth(child) {
		return this.parent.getChildWidth(this);
	}

	getSpaceBelowChild(child) {
		var i;
		// Find the index of the child
		for (i = 1; this.children[i - 1] !== child && i < this.children.length; i++) {
		}
		var sum = 0;
		// Sum all the heights below the child
		for (; i < this.children.length; i++) {
			sum += this.children[i].getHeight();
		}
		sum += this.parent.getSpaceBelowChild(this);
		return sum;
	}

	getHeight() {
		var sum = 0;
		// TODO REPLACE WITH Array.reduce()
		this.children.forEach(function (child) {
			sum += child.getHeight();
		});
		return sum;
	}

	setParent(parent_) {
		this.parent = parent_;
	}

	isFooter() {
		return this.parent.isFooter(this);
	}

	redrawBelowChild(child) {
		var found = false;
		this.children.forEach(function (ch) {
			if (found) {
				ch.rewrite();
			}
			if (child === ch) {
				found = true;
			}
		});
		this.parent.redrawBelowChild(this);
	}

	rewrite() {
		this.children.forEach(function (child) {
			child.rewrite();
		});
	}

	reset() {
		this.children.forEach(function (child) {
			child.reset();
		});
	}

	setFooter(footer_) {
		this.children.forEach(function (child) {
			child.setFooter(footer_);
		});
	}

	reserveSpace() {
		throw new Error('NOT IMPLEMENTED')
	}
}