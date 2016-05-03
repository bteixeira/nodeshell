var colors = require('colors');
var path = require('path');
var utils = require(nsh.home + '/src/utils');
var fs = require('fs');

(function () {
    var hostname = require('os').hostname();
    var gitBranchCmd = 'git symbolic-ref --short HEAD 2>/dev/null';
    var execSync = require('child_process').execSync;

    nsh.lineReader.setPrompt(function () {
        var branch;
        try {
            branch = colors.grey('|') + colors.blue(execSync(gitBranchCmd).toString().trim());
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
        for (var i = 1 ; i < cwd.length - 1 ; i++) {
            if (cwd[i].length > CWD_TRIM_SIZE) {
                cwd[i] = cwd[i].slice(0, CWD_TRIM_SIZE) + '\u2026';
            }
        }
        cwd = cwd.join(path.sep);

        return process.env.USER + colors.grey('@') + hostname + colors.grey(':') + cwd + branch + colors.green(' \u2B22 '); // or \u2B21
    });
})();

//console.log('Now running NSH');


NSH.setLayout({
    cols: [
        {
            width: 'auto',
            rows: [
                {
                    name: 'prompt'
                }, {
                    name: 'completions'
                }
            ]
        }, {
            name: 'separator',
            width: 3
        }, {
            width: 40,
            name: 'sidebar'
        }
    ]
});

NSH.layout.separator.setRedraw(function () {
    this.write(colors.blue(' \u2502  \u2502  \u2502  \u2502  \u2502'));
});
NSH.layout.sidebar.setRedraw(function () {
    var me = this;
    fs.readdir('.', function (err, files) {
        if (err) {
            me.write(colors.red(err.toString()));
        } else {
            if (files.length <= 5) {
                me.write(files.join('\n') + '\n');
            } else {
                me.write(files.slice(0, 4).join('\n') + '\n');
                me.write(colors.grey('  (' + (files.length - 4) + ' more...)'))
            }
        }
    });
});
NSH.layout.completions.setRedraw(function () {
    this.write('Completions go here...');
});





/**/
// TODO THIS IS KINDA HOW IT SHOULD BE
NSH.on('before-execute before-exit', function () {
    NSH.layout.separator.clear();
    NSH.layout.sidebar.clear();
    NSH.layout.completions.clear();
});
NSH.on('before-prompt', function () {
    NSH.layout.separator.write(colors.blue(' \u2502  \u2502  \u2502  \u2502  \u2502'));
});
NSH.lineReader.on('update', function () {
    // TODO THIS SHOULD TRY TO COMPLETE THE LAST TOKEN WITH A FILENAME, MAYBE THIS SHOULDN'T BE CALLED ON THE lineReader BUT ON THE PARSER OR SOMETHING
    var me = this;
    fs.readdir('.', function (err, files) {
        if (err) {
            me.write(colors.red(err.toString()));
        } else {
            if (files.length <= 5) {
                me.write(files.join('\n') + '\n');
            } else {
                me.write(files.slice(0, 4).join('\n') + '\n');
                me.write(colors.grey('  (' + (files.length - 4) + ' more...)'))
            }
        }
    });
});
// NSH.completions.setPanel(NSH.layout.completions);