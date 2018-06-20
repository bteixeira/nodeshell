var rl = require('readline');
var Writer = require('./writerPanel');
import {Panel} from '../composer';

/**
 *
 * @param children
 *      array with the children panels
 * @param layout
 *      array with width specifications. This array must have the same length as `children`. All but one of the
 *      elements must be a number, indicating the width of the respective panel in columns. The remaining element must
 *      be the string 'auto'. The 'auto' child will take the remaining width available to this panel.
 * @param stdout
 */
export default class ColumnsLayout implements Panel {
	private parent: Panel;

	constructor(private children, private layout, private stdout) {
		children.forEach(child => {
			child.setParent(this);
		});
	}

	getChildOffsetV(child) {
		return this.parent.getChildOffsetV(this);
	}

	getChildOffsetH(child) {
		var lt;
		var sum = 0; // the sum of all widths of all children except the `auto`
		var sumBefore; // the sum of the widths to the left of the child we're calculating
		var autoFound = false; // whether the 'auto' child was found yet
		var childFound = false; // whether the child we're calculating has been found yet
		for (var i = 0; i < this.children.length; i++) {
			// this.children.forEach(child => {
			lt = this.layout[i];
			if (child === this.children[i]) {
				if (!autoFound) {
					return sum + this.parent.getChildOffsetH(this); // if we found the child and there's no `auto` to its left, then we already know the offset
				}
				// otherwise, the `auto` child has been found before and we must iterate to the end to know how wide it is
				childFound = true;
				sumBefore = sum;
				sum += lt;
			} else {
				if (lt === 'auto') {
					autoFound = true;
				} else {
					sum += lt;
				}
			}
		}
		// )

		// still here, there is an auto child before the child we're calculating
		var autoWidth = this.parent.getChildWidth(this) - sum;
		sumBefore += autoWidth;
		return this.parent.getChildOffsetH(this) + sumBefore;
	}

	getChildOffset(child) {
		return [this.getChildOffsetV(child), this.getChildOffsetH(child)];
	}

	getChildWidth(child) {
		var sum = 0;
		for (var i = 0; i < this.children.length; i++) {
			var lt = this.layout[i];
			if (child === this.children[i]) {
				if (lt !== 'auto') {
					return lt;
				}
			} else {
				if (lt !== 'auto') {
					sum += lt;
				}
			}
		}

		// still here, so this is the auto child
		return this.parent.getChildWidth(this) - sum;
	}

	getSpaceBelowChild(child) {
		return this.parent.getSpaceBelowChild(this);
	}

	getHeight() {
		var max = 0;
		this.children.forEach(function (child) {
			if (child.getHeight() > max) {
				max = child.getHeight();
			}
		});
		return max;
	}

	setParent(parent_) {
		this.parent = parent_;
	}

	isFooter(child) {
		return this.parent.isFooter(this);
	}

	redrawBelowChild(child) {
		var me = this;
		var height = this.getHeight();

		// Since this call was triggered by a child that added a new line, we need to clear the last line of each sibling.
		this.children.forEach(ch => {
			if (ch !== child && ch.getHeight() < height) {
				var offsetThis = me.getChildOffset(ch);
				var offsetThat = Writer.active.getOffset();
				var delta = [
					offsetThis[0] - offsetThat[0],
					offsetThis[1] - offsetThat[1]
				];

				// We actually want to jump to the last line, not the first
				delta[0] += height - 1;

				// Jump from active panel (which might not be a child of this) to the child that needs updating
				rl.moveCursor(this.stdout, delta[1], delta[0]);

				// Write full line of spaces according to child's width
				var childWidth = me.getChildWidth(ch);
				this.stdout.write(new Array(childWidth + 1).join(' '));

				delta[1] += childWidth;
				// If this panel is on the right edge of the screen, the cursor is actually one character behind
				if (me.getChildOffsetH(ch) + childWidth === this.stdout.columns) {
					delta[1] -= 1;
				}

				// Jump back to active
				rl.moveCursor(this.stdout, -delta[1], -delta[0]);
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