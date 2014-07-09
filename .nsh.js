console.log('Now running NSH\n');

prompt = (function () {
    var hostname = require('os').hostname();
    return function () {
        return process.env.USER + '@' + hostname + ':' + process.cwd() + ' \u2B21  ';
    };
})();
