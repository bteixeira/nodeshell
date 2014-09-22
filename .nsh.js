var colors = require('colors');

(function () {
    var hostname = require('os').hostname();
    NSH.lineReader.setPrompt(function () {
        return '\n' + process.env.USER + colors.grey('@') + hostname + colors.grey(':') + process.cwd() + colors.green(' \u2B22  '); // or \u2B21
    });
})();

NSH.alias('gst', 'git status');
NSH.alias('gco', 'git checkout');
NSH.alias('gcm', 'git checkout master');

console.log('Now running NSH');
