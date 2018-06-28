import WriterPanel from './writerPanel';

/**
 *
 */
export default interface Panel {

	prompt?: WriterPanel;
	writers?;
	name?: string;

	getChildOffsetV: (Panel) => number;
	getChildOffsetH: (Panel) => number;
	getChildOffset: (Panel) => [number, number]; // LENGTH === 2
	getChildWidth: (Panel) => number;

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

	redrawBelowChild: (Panel) => void;
	rewrite: () => void;
	reset: () => void;
	setParent: (Panel) => void;
	getHeight: () => number;

	// TODO REMOVE ME, THIS IS A SPECIFIC DESCENDANT PANEL USED BY THE CURRENT PROFILE, NAMED PANELS SHOULD BE HANDLED IN A TYPE SAFE WAY
	completions?: Panel;
}
