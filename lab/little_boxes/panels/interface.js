module.exports = {

    /**
     * Gets the vertical offset of a child relative to the top-left corner of the top-level layout (either the Center or
     * Footer).
     * @param child
     */
    getChildOffsetV: function (child) {
    },

    /**
     * Gets the vertical offset of a child relative to the top-left corner of the top-level layout (will always be
     * relative to the edge of the screen).
     * @param child
     */
    getChildOffsetH: function (child) {
    },

    /**
     * Gets an array with the Vertical and Horizontal offsets of a child.
     * Anytime a two-dimensional offset is returned as an array, the first position will always be with the vertical
     * index (lines).
     * @param child
     */
    getChildOffset: function (child) {
    },

    /**
     * Get the width of a child
     * @param child
     */
    getChildWidth: function (child) {
    },

    /**
     * Get the height of a child
     * @param child
     */
    getChildHeight: function (child) {
    },

    /**
     * Given a child, returns the amount of lines below that child which are used by other panels.
     * @param child
     */
    getSpaceBelowChild: function (child) {
    },

    /**
     * The minimum height of this panel, as opposed to the "virtual" height, only known by the parent. As an example,
     * in a column layout, all panels will always have the same "virtual" height, even though a panel may have more
     * lines than the others (and therefore have a higher minimum height than its siblings).
     */
    getMinHeight: function () {
    },

    /**
     * Set the parent
     * @param parent
     */
    setParent: function (parent) {
    },

    /**
     * Whether this panel is included on the top-level footer layout or not. Usually this will be delegated to the
     * parent, and the top-level layouts will return either true or false.
     */
    isFooter: function () {
    },

    /**
     * Make sure there is enough space to draw all the layouts. This is meant to be called on the Center layout at
     * start-up.
     */
    reserveSpace: function () {
    },

    /**
     * Whenever a child grows vertically (by adding a new line) it will use this method to request a redraw of any
     * panels that need it.
     * @param child
     */
    drawBelowChild: function (child) {
    },

    /**
     * Rewrite the content of this panel. The panel is responsible for moving the cursor from the active panel and back.
     */
    rewrite: function () {
    },

    /**
     * Get the width of this panel.
     */
    width: function () {
    },

    /**
     * Set the footer object
     * @param footer
     */
    setFooter: function (footer) {
    },

    /**
     * WRITER ONLY
     * Write a single character on this panel.
     * The writer assumes it is the active one and the cursor is where it should.
     *
     * @param ch the character to write
     * @param skipChecks set true to not add the character to the internal content buffer and to disable redrawing when
     * adding new lines. This should be set to true when this panel is already being rewritten.
     */
    insert: function (ch, skipChecks) {},

    /**
     * WRITER ONLY
     * Rewinds the cursor to the top-left corner of this writer.
     */
    rewind: function () {},

    /**
     * WRITER ONLY
     * Makes this writer the "active" one. The active writer has the cursor in its area.
     */
    activate: function () {},

    /**
     * WRITER ONLY
     * Get the height of this writer.
     */
    height: function () {},

    /**
     * WRITER ONLY
     * Get the space below this writer.
     */
    afterSpace: function () {},

    /**
     * WRITER ONLY
     * Get the horizontal offset of this writer
     */
    getOffsetH: function () {},

    /**
     * WRITER ONLY
     * Get an array with the offsets of this writer (vertical, horizontal).
     */
    getOffset: function () {}
};
