var assert = require('assert');
var should = require('should');
var DescentParser = require('../../dist/parser/descentParser').default;
var Tape = require('../../dist/tape').default;
var commandsStub = require('../../test/commandsStub');
var CLT = require('../../dist/tokenizer/commandLineTokenizer').default;

describe('DefaultParser', function () {
    var parser = new DescentParser(commandsStub);

    it('handles single command [git]', function () {
        var tokens = CLT('git');
        parser.tape = new Tape(tokens);
        ast = parser.COMMAND_LINE();

        ast.type.should.equal('COMMAND');
        ast.cmd.should.equal('git');
        ast.args.length.should.equal(0);
    });

    describe('SIMPLE_COMMAND', function () {
        it('handles single command [git]', function () {
            var tokens = CLT('git');
            parser.tape = new Tape(tokens);
            var ast = parser.SIMPLE_COMMAND();

            ast.type.should.equal('COMMAND');
            ast.cmd.should.equal('git');
            ast.args.length.should.equal(0);

            parser.tape.pos.should.equal(1);
        });
    });

    describe('PIPELINE', function () {
        it('handles single command [git]', function () {
            var tokens = CLT('git');
            parser.tape = new Tape(tokens);
            var ast = parser.PIPELINE();

            ast.type.should.equal('COMMAND');
            ast.cmd.should.equal('git');
            ast.args.length.should.equal(0);

            parser.tape.pos.should.equal(1);
        });
    });

    describe('LIST', function () {
        it('handles single command [git]', function () {
            var tokens = CLT('git');
            parser.tape = new Tape(tokens);
            var ast = parser.LIST();

            ast.type.should.equal('COMMAND');
            ast.cmd.should.equal('git');
            ast.args.length.should.equal(0);

            parser.tape.pos.should.equal(1);
        });
    });

    describe('SUBSHELL', function () {
        it('handles single command [git]', function () {
            var tokens = CLT('git');
            parser.tape = new Tape(tokens);
            var ast = parser.SUBSHELL();

            ast.type.should.equal('COMMAND');
            ast.cmd.should.equal('git');
            ast.args.length.should.equal(0);

            parser.tape.pos.should.equal(1);
        });
    });

    describe('COMMAND_LINE', function () {
        it('handles single command [git]', function () {
            var tokens = CLT('git');
            parser.tape = new Tape(tokens);
            var ast = parser.COMMAND_LINE();

            ast.type.should.equal('COMMAND');
            ast.cmd.should.equal('git');
            ast.args.length.should.equal(0);
        });
    });
});
