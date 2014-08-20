var colors = require('colors');

(function () {
    var hostname = require('os').hostname();
    NSH.lineReader.setPrompt(function () {
        return process.env.USER + colors.grey('@') + hostname + colors.grey(':') + process.cwd() + colors.green(' \u2B22  '); // or \u2B21
    });
})();

console.log('Now running NSH\n');
