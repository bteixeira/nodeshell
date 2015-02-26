var colors = require('colors');
var path = require('path');
var utils = require(NSH.home + '/src/utils');

(function () {
    var hostname = require('os').hostname();
    var gitBranchCmd = 'git symbolic-ref --short HEAD 2>/dev/null';
    var execSync = require('child_process').execSync;

    NSH.lineReader.setPrompt(function () {
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

        return '\n' + process.env.USER + colors.grey('@') + hostname + colors.grey(':') + cwd + branch + colors.green(' \u2B22 '); // or \u2B21
    });
})();

console.log('Now running NSH');
