var assert = require('assert');
var should = require('should');
var Parser = require('../../dist/parser/descentParser');
var Tape = require('../../dist/tape').default;
var commandsStub = require('../../test/commandsStub');
var CLT = require('../../dist/tokenizer/commandLineTokenizer').default;

describe('DefaultParser', function () {

    var parser = new Parser(commandsStub);

    it.skip('skips JS [(getThing()) anotherArg]', function () {
        var tape = new Tape('(getThing()) anotherArg');
        assert.equal(tape.pos, 0);
        tape.next();
        assert.equal(tape.pos, 1);
        parser.skipJS(tape);
        assert.equal(tape.pos, 11);
    });

    it.skip('parses simple JS argument [(getThing())]', function () {

        var tape = new Tape('(getThing())');
        var ast = parser.parseArg(tape);

        assert.equal(ast.type, 'JS');
        assert.equal(ast.code, 'getThing()');
    });

    it.skip('parses simple JS with pre whitespace [(  getThing())]', function () {

        var tape = new Tape('(  getThing())');
        var ast = parser.parseArg(tape);

        assert.equal(ast.type, 'JS');
        assert.equal(ast.code, 'getThing()');
    });

    it.skip('throws error on invalid JS with pre whitespace [( function xxx  {}getGit() ;;; var {{ ;) otherArg]', function () {

        var tape = new Tape('( function xxx  {}getGit() ;;; var {{ ;) otherArg');

        assert.throws(function () {
            parser.parseArg(tape);
        }, 'Found closing brace without matching opening brace');

    });

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

    it.skip('handles command with single literal argument [git checkout]', function () {

        var ast = parser.parse('git checkout');

        assert.equal(ast.type, 'CMD');
        assert.equal(ast.name, 'git');
        assert.equal(ast.args.length, 1);

        assert.equal(ast.args[0].type, 'Literal');
        assert.equal(ast.args[0].text, 'checkout');
    });

    it.skip('handles command with two literal arguments [git checkout master]', function () {

        var ast = parser.parse('git checkout master');

        assert.equal(ast.type, 'CMD');
        assert.equal(ast.name, 'git');
        assert.equal(ast.args.length, 2);

        assert.equal(ast.args[0].type, 'Literal');
        assert.equal(ast.args[0].text, 'checkout');

        assert.equal(ast.args[1].type, 'Literal');
        assert.equal(ast.args[1].text, 'master');
    });

    it.skip('handles command with simple JS argument [git (getGit())]', function () {

        var ast = parser.parse('git (getGit())');

        assert.equal(ast.type, 'CMD');
        assert.equal(ast.name, 'git');
        assert.equal(ast.args.length, 1);

        assert.equal(ast.args[0].type, 'JS');
        assert.equal(ast.args[0].code, 'getGit()');
    });

    it.skip('throws error on command with weird invalid JS argument [git ( function xxx  {}getGit() ;;; var {{ ;)]', function () {

        var js = ' function xxx  {}getGit() ;;; var {{ ;';
        var ast = parser.parse('git (' + js + ')');

        assert.equal(ast.type, 'ERR');
        assert.equal(ast.msg, 'Found closing brace without matching opening brace');
    });

    it.skip('throws error on JS argument with non matching curly brace [git ( arr=["checkout"]; arr[0} )]', function () {
        var js = ' arr=["checkout"]; arr[0} ';
        var ast = parser.parse('git (' + js + ')');

        assert.equal(ast.type, 'ERR');
        assert.equal(ast.msg, 'Found closing brace without matching opening brace');
    });

    it.skip('throws error on JS argument with non matching square brace [git ( (function(){ return \'checkout\';])() )]', function () {
        var js = ' (function(){ return \'checkout\';])() ';
        var ast = parser.parse('git (' + js + ')');

        assert.equal(ast.type, 'ERR');
        assert.equal(ast.msg, 'Found closing brace without matching opening brace');
    });

    it.skip('throws error on unterminated JS argument [git ("checkout"]', function () {
        var ast = parser.parse('git ("checkout"');

        assert.equal(ast.type, 'ERR');
        assert.equal(ast.msg, 'Unterminated JS (opening brace without matching closing brace)');
    });

    it.skip('handles command with JS and literal arguments, whitespace all around [  git \t ( getGit ()   ; )  lalala ]', function () {

        var ast = parser.parse('  git \t ( getGit ()   ; )  lalala ');

        assert.equal(ast.type, 'CMD');
        assert.equal(ast.name, 'git');
        assert.equal(ast.args.length, 2);

        assert.equal(ast.args[0].type, 'JS');
        assert.equal(ast.args[0].code, 'getGit ()   ;');

        assert.equal(ast.args[1].type, 'Literal');
        assert.equal(ast.args[1].text, 'lalala');
    });

    it.skip('handles line with only javascript [ ~(function () {}).toString(); //-1 ]', function () {

        var ast = parser.parse('~(function () {}).toString(); //-1');

        assert.equal(ast.type, 'JS');
        assert.equal(ast.code, '~(function () {}).toString(); //-1');
    });

});
