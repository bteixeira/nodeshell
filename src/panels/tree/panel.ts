import WriterPanel from './writerPanel';

/**
 *
 */
export default interface Panel {

	prompt?: WriterPanel;
	writers?: WriterPanel[];
	name?: string;

	getChildOffsetV: (Panel: Panel) => number;
	getChildOffsetH: (Panel: Panel) => number;
	getChildOffset: (Panel: Panel) => [number, number];
	getChildWidth: (Panel: Panel) => number;

	/**
	 * @param {Panel} child a child of this panel
	 * @returns {number} the number of text rows available in the screen below that child.
	 */
	getSpaceBelowChild: (child: Panel) => number;

	/**
	 * Determines whether a child Panel is in a footer of a layout, or descendant of a Panel that is in the footer of a
	 * layout. If the child parameter is not a child of this Panel, the result is indeterminate.
	 * @param Panel
	 * @returns {boolean}
	 */
	isFooter: (child: Panel) => boolean;

	/**
	 * Ensures that enough screen lines are scrolled that the calculated needed height
	 * of this panel is actually available in the screen.
	 */
	reserveSpace: () => void;

	redrawBelowChild: (Panel: Panel) => void;

	// Just calls rewrite() on all children, WriterPanel calls reset() followed by redraw()
	rewrite: () => void;

	/**
	 * Resets the buffered content of this panel. Does not clean the screen.
	 */
	reset: () => void;

	setParent: (Panel: Panel) => void;

	setFooter: (Panel: Panel) => void;

	/**
	 * @returns {number} The number of rows needed to display the content of this panel
	 */
	getHeight: () => number;

	// TODO REMOVE ME, THIS IS A SPECIFIC DESCENDANT PANEL USED BY THE CURRENT PROFILE, NAMED PANELS SHOULD BE HANDLED IN A TYPE SAFE WAY
	completions?: WriterPanel;
}
