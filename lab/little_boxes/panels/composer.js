//var SingleWriter = require('./composer/singleWriter');
var SingleWriterLayout = require('./composer/singleWriterLayout');
var CenterFooterLayout = require('./composer/centerFooterLayout');
var Center = require('./center');
var Footer = require('./footer');
var RowsLayout = require('./rows');
var ColumnsLayout = require('./cols');
var Writer = require('./writer');

module.exports = {
    buildInit: function (spec, stdout) {

        if (arguments.length === 1) {
            stdout = spec;
            spec = null;
        }

        var names = {};
        var result;

        if (!spec || !Object.keys(spec).length) {
            // Single Writer layout ...
            result = SingleWriterLayout(stdout);
        } else if (spec.center && spec.footer) {
            // CenterFooter layout ...

            var footerChild = this.build(spec.footer, names, stdout);
            var footer = new Footer(footerChild, stdout);

            var centerChild = this.build(spec.center, names, stdout);
            var center = new Center(centerChild, stdout, footer);

            result = CenterFooterLayout(center, footer);
        } else {
            // Center only layout ...
            var built = this.build(spec, names, stdout);
            result = CenterFooterLayout(built);
        }

        for (var n in names) {
            result[n] = names[n];
        }

        return result;
    },

    build: function (spec, names, stdout) {
        // TODO MAYBE WE SHOULD CHECK THAT THERE IS NO COLUMNS-COLUMNS OR ROWS-ROWS NESTING
        var me = this;
        if (spec.rows) {
            var rows = [];
            spec.rows.forEach(function (row) {
                var child = me.build(row, names, stdout);
                rows.push(child);
                if (row.name) {
                    // TODO SHOULD WE CHECK FOR UNIQUE NAMES?
                    names[row.name] = child;
                }
            });
            return new RowsLayout(rows);
        } else if (spec.cols) {
            // TODO MUST CHECK THAT ONE WIDTH IS 'auto' AND THE REST ARE NUMBERS
            // TODO MUST CHECK THAT SUM OF WIDTHS IS NOT LARGER THAN AVAILABLE FOR THIS PANEL
            var cols = [];
            var layout = [];
            spec.cols.forEach(function (col) {
                if (col.width !== 'auto' && typeof col.width !== 'number') {
                    throw 'Column definition needs width specification (either number or "auto")';
                }
                layout.push(col.width);
                var child = me.build(col, names, stdout);
                cols.push(child);
                if (col.name) {
                    // TODO SHOULD WE CHECK FOR UNIQUE NAMES?
                    names[col.name] = child;
                }
            });
            return new ColumnsLayout(cols, layout, stdout);
        } else {
            return new Writer(stdout);
        }
    }
};