import CenterFooterLayout from './tree/centerFooterLayout';
import ColumnsLayout from './tree/columnsLayout';
import RowsLayout from './tree/rowsLayout';
var WriterPanel = require('./tree/writerPanel');

interface LayoutSpec {
    cols: LayoutSpec[];
    rows: LayoutSpec[];
    name: string;
    width: number | 'auto';
}

export interface Panel {
	getChildOffsetV: (Panel) => number;
	getChildOffsetH: (Panel) => number;
	getChildOffset: (Panel) => number[]; // LENGTH === 2
	getChildWidth: (Panel) => number;
	getSpaceBelowChild: (Panel) => number;
	isFooter: (Panel) => boolean;
	reserveSpace: () => void;
	redrawBelowChild: (Panel) => void;
	rewrite: () => void;
	reset: () => void;
	prompt?;
	writers?;
	name?: string;
}

// interface Result extends Panel {
// 	prompt;
// 	writers;
// }

export default {
    buildInit(spec: LayoutSpec, stdout) {

        if (arguments.length === 1) {
            stdout = spec;
            spec = null;
        }

        var names = {};
        var writers = [];
        var result: Panel;

        if (!spec || !Object.keys(spec).length) {
            // Single Writer layout ...
            var singleWriter = new WriterPanel(stdout);
            //result = SingleWriterLayout(stdout);
            result = new CenterFooterLayout(singleWriter, null, stdout);
            result.prompt = singleWriter;
        //}

        /* TODO

        else if (spec.center && spec.footer) {
            // CenterFooter layout ...

            var footerChild = this.build(spec.footer, names, stdout);
            var footer = new Footer(footerChild, stdout);

            var centerChild = this.build(spec.center, names, stdout);
            var center = new Center(centerChild, stdout, footer);

            result = CenterFooterLayout(center, footer);
            */
        } else {
            // Center only layout ...
            var built = this.build(spec, names, writers, stdout);
            result = new CenterFooterLayout(built, null, stdout);
        }

        for (var n in names) {
            result[n] = names[n];
        }
        result.writers = writers;
        /**/

        result.prompt.calculateWidth();
        result.prompt.activate();

        return result;
    },

    build: function (spec: LayoutSpec, names, writers, stdout) {
        // TODO MAYBE WE SHOULD CHECK THAT THERE IS NO COLUMNS-COLUMNS OR ROWS-ROWS NESTING
        var result: Panel;
        if (spec.rows) {
            var rows = [];
            spec.rows.forEach(row => {
                var child = this.build(row, names, writers, stdout);
                rows.push(child);
                if (row.name) {
                    // TODO SHOULD WE CHECK FOR UNIQUE NAMES?
                    names[row.name] = child;
                }
            });
            result = new RowsLayout(rows);
        } else if (spec.cols) {
            // TODO MUST CHECK THAT ONE WIDTH IS 'auto' AND THE REST ARE NUMBERS
            // TODO MUST CHECK THAT SUM OF WIDTHS IS NOT LARGER THAN AVAILABLE FOR THIS PANEL
            var cols = [];
            var layout = [];
            spec.cols.forEach(col => {
                if (col.width !== 'auto' && typeof col.width !== 'number') {
                    throw 'Column definition needs width specification (either number or "auto")';
                }
                layout.push(col.width);
                var child = this.build(col, names, writers, stdout);
                cols.push(child);
                if (col.name) {
                    // TODO SHOULD WE CHECK FOR UNIQUE NAMES?
                    names[col.name] = child;
                }
            });
            result = new ColumnsLayout(cols, layout, stdout);
        } else {
            var writer = new WriterPanel(stdout);
            writers.push(writer);
            result = writer;
        }
        if (spec.name) {
            names[spec.name] = result;
            result.name = spec.name;
        }
        return result;
    }
};