var jsMatcher = require('../../../dist/tokenizer/matchers/jsMatcher');
var Tape = require('../../../dist/tape').default;

describe('Matcher for Javascript snippets', function () {

    it('fails if tape is not positioned at JS', function () {
        var tape = new Tape('   (var x = 3)');
        var token = jsMatcher.run(tape);
        token.type.should.be.exactly(jsMatcher.tokens.JS_ERROR);
    });

    it('moves the tape to just after JS', function () {
        var str =
'   (var undefined = "qwe\\ \\n\\\\rt  \\\"  y"; var another = function(){if(true) {} else {this["asd"].haha({});}}){!%^}';
        var tape = new Tape(str);
        tape.pos = 3;
        var token = jsMatcher.run(tape);
        token.type.should.be.exactly(jsMatcher.tokens.JSTOKEN);
        token.text.should.equal(str.slice(3, 109));
        token.pos.should.equal(3);
        tape.pos.should.equal(109);
    });

    it('complains if JS is not terminated', function () {
        var str = '(var undefined = 90000;';
        var tape = new Tape(str);

        var token = jsMatcher.run(tape);
        token.type.should.be.exactly(jsMatcher.tokens.JS_ERROR);
        token.text.should.equal(str);
        token.pos.should.equal(str.length);
        tape.pos.should.equal(str.length);
    });

    it('complains if JS has wrong nesting order', function () {
        var str = '(var undefined = function () {console.log("qwerty");) other arguments';
        var tape = new Tape(str);

        var token = jsMatcher.run(tape);
        token.type.should.be.exactly(jsMatcher.tokens.JS_ERROR);
        token.text.should.equal(')');
        token.pos.should.equal(52);
        tape.pos.should.equal(53);
    });
});
