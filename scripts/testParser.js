var Parser = require('../src/parser/parser');
var Printer = require('../src/ast/visitorPrinter');

var commandsStub = require('../test/commandsStub');

var parser = new Parser(commandsStub);
var printer = new Printer();

process.stdin.on('data', function (line) {
    var ast = parser.parse(line.toString());
    printer.visit(ast);
    process.exit(0);
});
