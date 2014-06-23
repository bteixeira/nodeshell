var Parser = require(__dirname + '/parser');
var Printer = require(__dirname + '/../ast/visitorPrinter');

var commandsStub = require(__dirname + '/../../test/commandsStub');

var parser = new Parser(commandsStub);
var printer = new Printer();

process.stdin.on('data', function (line) {
    var ast = parser.parse(line.toString());
    printer.visit(ast);
    process.exit(0);
});
