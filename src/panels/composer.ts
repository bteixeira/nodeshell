import {WriteStream} from 'tty';
import CenterFooterLayout from './tree/centerFooterLayout';
import ColumnsLayout from './tree/columnsLayout';
import RowsLayout from './tree/rowsLayout';
import Panel from './tree/panel';
import WriterPanel from './tree/writerPanel';

type WidthSpec = number | 'auto';

export interface LayoutSpec {
	cols?: LayoutSpec[];
	rows?: LayoutSpec[];
	name: string;
	width?: WidthSpec;
}

type PanelSet = {
	[name: string]: Panel;
}

export default {
	buildInit (spec: LayoutSpec, stdout: WriteStream): Panel {
		const names: PanelSet = {};
		const writers: WriterPanel[] = [];
		var panel: Panel;

		if (!spec || !Object.keys(spec).length) {
			// Single Writer layout ...
			const writerPanel = new WriterPanel(stdout);
			panel = new CenterFooterLayout(writerPanel, null, stdout);
			panel.prompt = writerPanel;
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
			const built: Panel = this.build(spec, names, writers, stdout);
			panel = new CenterFooterLayout(built, null, stdout);
		}

		for (var n in names) {
			panel[n] = names[n];
		}
		panel.writers = writers;
		/**/

		panel.prompt.calculateWidth();
		panel.prompt.activate();

		return panel;
	},

	build: function (spec: LayoutSpec, names: PanelSet, writers: WriterPanel[], stdout: WriteStream): Panel {
		// TODO MAYBE WE SHOULD CHECK THAT THERE IS NO COLUMNS-COLUMNS OR ROWS-ROWS NESTING
		var result: Panel;
		if (spec.rows) {
			const rows: Panel[] = [];
			spec.rows.forEach(row => {
				const child: Panel = this.build(row, names, writers, stdout);
				rows.push(child);
				if (row.name) {
					// TODO SHOULD WE CHECK FOR UNIQUE NAMES?
					names[row.name] = child;
					// TODO DO WE NEED TO HANDLE NAMES OF CHILDREN? ALL OF THEM HAVE THEIR OWN ITERATION OF build() WHICH HANDLES THE NAME
				}
			});
			result = new RowsLayout(rows);
		} else if (spec.cols) {
			// TODO MUST CHECK THAT ONE WIDTH IS 'auto' AND THE REST ARE NUMBERS
			// TODO MUST CHECK THAT SUM OF WIDTHS IS NOT LARGER THAN AVAILABLE FOR THIS PANEL
			const cols: Panel[] = [];
			const layout: WidthSpec[] = [];
			spec.cols.forEach(col => {
				if (col.width !== 'auto' && typeof col.width !== 'number') {
					// TODO NOT NEEDED? TYPE SYSTEM
					throw 'Column definition needs width specification (either number or "auto")';
				}
				layout.push(col.width);
				const child = this.build(col, names, writers, stdout);
				cols.push(child);
				if (col.name) {
					// TODO SHOULD WE CHECK FOR UNIQUE NAMES?
					names[col.name] = child;
					// TODO DO WE NEED TO HANDLE NAMES OF CHILDREN? ALL OF THEM HAVE THEIR OWN ITERATION OF build() WHICH HANDLES THE NAME
				}
			});
			result = new ColumnsLayout(cols, layout, stdout);
		} else {
			const writer = new WriterPanel(stdout);
			writers.push(writer);
			result = writer;
		}
		if (spec.name) {
			names[spec.name] = result;
			result.name = spec.name;
		}
		return result;
	},
};