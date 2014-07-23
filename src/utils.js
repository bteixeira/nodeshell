var fs = require('fs');
var vm = require('vm');
var ErrorWrapper = require('./errorWrapper');

exports.sourceSync = function (filename, context) {
    if (!fs.existsSync(filename)) {
        return new ErrorWrapper('No such file: ' + filename);
    }
    var contents = fs.readFileSync(filename);
    return vm.runInContext(contents, context);
};

exports.isString = function (candidate) {
    return typeof candidate === 'string' || candidate instanceof String;
};
