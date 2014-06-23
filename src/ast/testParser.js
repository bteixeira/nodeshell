var Parser = require(__dirname + '/parser');
var parser = new Parser();
var Printer = require(__dirname + '/visitorPrinter');
var printer = new Printer();

process.stdin.on('data', function (line) {
    var ast = parser.parse(line.toString());
    printer.visit(ast);
    process.exit(0);
});
