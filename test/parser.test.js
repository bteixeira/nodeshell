var assert = require('assert');
var Parser = require(__dirname + '/../src/parser/parser');
var Pointer = require(__dirname + '/../src/parser/linePointer');
var commandsStub = require(__dirname + '/../test/commandsStub');

describe('Parser', function () {

    var parser = new Parser(commandsStub);

    it('skips JS [(getThing()) anotherArg]', function () {
        var pointer = new Pointer('(getThing()) anotherArg');
        assert.equal(pointer.pos, 0);
        pointer.next();
        assert.equal(pointer.pos, 1);
        parser.skipJS(pointer);
        assert.equal(pointer.pos, 11);
    });

    it('parses simple JS argument [(getThing())]', function () {

        var pointer = new Pointer('(getThing())');
        var ast = parser.parseArg(pointer);

        assert.equal(ast.type, 'JS');
        assert.equal(ast.code, 'getThing()');
    });

    it('parses simple JS with pre whitespace [(  getThing())]', function () {

        var pointer = new Pointer('(  getThing())');
        var ast = parser.parseArg(pointer);

        assert.equal(ast.type, 'JS');
        assert.equal(ast.code, 'getThing()');
    });

    it('throws error on invalid JS with pre whitespace [( function xxx  {}getGit() ;;; var {{ ;) otherArg]', function () {

        var pointer = new Pointer('( function xxx  {}getGit() ;;; var {{ ;) otherArg');

        assert.throws(function () {
            parser.parseArg(pointer);
        }, 'Found closing brace without matching opening brace');

    });

    it('handles single command [git]', function () {

        var ast = parser.parse('git');

        assert.equal(ast.type, 'CMD');
        assert.equal(ast.name, 'git');
        assert.equal(ast.args.length, 0);
    });

    it('handles command with single literal argument [git checkout]', function () {

        var ast = parser.parse('git checkout');

        assert.equal(ast.type, 'CMD');
        assert.equal(ast.name, 'git');
        assert.equal(ast.args.length, 1);

        assert.equal(ast.args[0].type, 'Literal');
        assert.equal(ast.args[0].text, 'checkout');
    });

    it('handles command with two literal arguments [git checkout master]', function () {

        var ast = parser.parse('git checkout master');

        assert.equal(ast.type, 'CMD');
        assert.equal(ast.name, 'git');
        assert.equal(ast.args.length, 2);

        assert.equal(ast.args[0].type, 'Literal');
        assert.equal(ast.args[0].text, 'checkout');

        assert.equal(ast.args[1].type, 'Literal');
        assert.equal(ast.args[1].text, 'master');
    });

    it('handles command with simple JS argument [git (getGit())]', function () {

        var ast = parser.parse('git (getGit())');

        assert.equal(ast.type, 'CMD');
        assert.equal(ast.name, 'git');
        assert.equal(ast.args.length, 1);

        assert.equal(ast.args[0].type, 'JS');
        assert.equal(ast.args[0].code, 'getGit()');
    });

    it('throws error on command with weird invalid JS argument [git ( function xxx  {}getGit() ;;; var {{ ;)]', function () {

        var js = ' function xxx  {}getGit() ;;; var {{ ;';
        var ast = parser.parse('git (' + js + ')');

        assert.equal(ast.type, 'ERR');
        assert.equal(ast.msg, 'Found closing brace without matching opening brace');
    });

    it('handles command with JS and literal arguments, whitespace all around [  git \t ( getGit ()   ; )  lalala ]', function () {

        var ast = parser.parse('  git \t ( getGit ()   ; )  lalala ');

        assert.equal(ast.type, 'CMD');
        assert.equal(ast.name, 'git');
        assert.equal(ast.args.length, 2);

        assert.equal(ast.args[0].type, 'JS');
        assert.equal(ast.args[0].code, 'getGit ()   ;');

        assert.equal(ast.args[1].type, 'Literal');
        assert.equal(ast.args[1].text, 'lalala');
    });

});
