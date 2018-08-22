var colors = require('colors');
var path = require('path');
var utils = require(nsh.home + '/utils');
var fs = require('fs');

(function () {
	// var hostname = require('os').hostname();
	var gitBranchCmd = 'git symbolic-ref --short HEAD 2>/dev/null';
	var gitDirtyCmd = 'git status --porcelain';
	var execSync = require('child_process').execSync;

	nsh.lineReader.setPrompt(function () {
		var branch;
		try {
			branch = ' ' + colors.cyan('(' + execSync(gitBranchCmd).toString().trim() + ')');
			var dirtyOutput = execSync(gitDirtyCmd).toString();
			var dirty = '';
			if (dirtyOutput) {
				dirty = colors.red(' ✘');
			}
			branch += dirty;
		} catch (e) {
			branch = '';
		}


		var home = utils.getUserHome();
		var cwd = process.cwd();
		if (cwd.indexOf(home) === 0) {
			cwd = '~' + cwd.substring(home.length);
		}
		cwd = cwd.split(path.sep);
		var CWD_TRIM_SIZE = 3;
		for (var i = 1; i < cwd.length - 1; i++) {
			if (cwd[i].length > CWD_TRIM_SIZE) {
				cwd[i] = cwd[i].slice(0, CWD_TRIM_SIZE) + '\u2026';
			}
		}
		cwd = cwd.join(path.sep);

		var time = new Date().toTimeString().split(' ')[0];

		return colors.black(colors.whiteBG(' ' + time + ' '))
			+ ' ' + colors.bold(cwd) + branch + ' ' + colors.green('\u2B22 '); // or \u2B21
	});
})();

// nsh.setLayout({
// 	cols: [
// 		{
// 			width: 'auto',
// 			rows: [
// 				{name: 'prompt'},
// 				{name: 'completions'},
// 			],
// 		}, {
// 			name: 'separator',
// 			width: 3,
// 		}, {
// 			name: 'sidebar',
// 			width: 40,
// 		},
// 	],
// });
//
// nsh.layout.separator.setRedraw(function () {
// 	this.write(colors.blue(' \u2502  \u2502  \u2502  \u2502  \u2502'));
// });
// nsh.layout.sidebar.setRedraw(function () {
// 	var me = this;
// 	fs.readdir('.', function (err, files) {
// 		if (err) {
// 			me.write(colors.red(err.toString()));
// 		} else {
// 			if (files.length <= 5) {
// 				me.write(files.join('\n') + '\n');
// 			} else {
// 				me.write(files.slice(0, 4).join('\n') + '\n');
// 				me.write(colors.grey('  (' + (files.length - 4) + ' more...)'))
// 			}
// 		}
// 	});
// });
// nsh.layout.completions.setRedraw(function () {
// 	// this.write('Completions go here...');
// });
//
// /**/
// // TODO THIS IS KINDA HOW IT SHOULD BE
// nsh.on('before-execute before-exit', function () {
// 	nsh.layout.separator.clear();
// 	nsh.layout.sidebar.clear();
// 	nsh.layout.completions.clear();
// });
// nsh.on('before-prompt', function () {
// 	nsh.layout.separator.write(colors.blue(' \u2502  \u2502  \u2502  \u2502  \u2502'));
// });
// nsh.lineReader.on('update', function () {
// 	// TODO THIS SHOULD TRY TO COMPLETE THE LAST TOKEN WITH A FILENAME, MAYBE THIS SHOULDN'T BE CALLED ON THE lineReader BUT ON THE PARSER OR SOMETHING
// 	var me = this;
// 	fs.readdir('.', function (err, files) {
// 		if (err) {
// 			me.write(colors.red(err.toString()));
// 		} else {
// 			if (files.length <= 5) {
// 				me.write(files.join('\n') + '\n');
// 			} else {
// 				me.write(files.slice(0, 4).join('\n') + '\n');
// 				me.write(colors.grey('  (' + (files.length - 4) + ' more...)'))
// 			}
// 		}
// 	});
// });
// nsh.completions.setPanel(nsh.layout.completions);