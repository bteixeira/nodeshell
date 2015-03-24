var dQStringMatcher = require('../../../src/tokenizer/matchers/dqStringMatcher');
var Tape = require('../../../src/tape');

describe('Matcher for Double-Quoted String', function () {

    it('fails if tape is not positioned at DQS', function () {
        var tape = new Tape('   "qwerty"');
        var token = dQStringMatcher.run(tape);
        token.type.should.be.exactly(dQStringMatcher.tokens.NO_DQSTRING);
    });

    it('moves the tape to just after DQS', function () {
        var str = '   "qwe\\ \\n\\\\rt  \\\"  y" {!%^}';
        var tape = new Tape(str);
        tape.pos = 3;
        var token = dQStringMatcher.run(tape);
        token.type.should.be.exactly(dQStringMatcher.tokens.DQSTRING);
        token.text.should.equal(str.slice(3, 23));
        token.pos.should.equal(3);
        tape.pos.should.equal(23);
    });

    it('complains if DQS is not terminated', function () {
        var str = '"qwerty';
        var tape = new Tape(str);

        var token = dQStringMatcher.run(tape);
        token.type.should.be.exactly(dQStringMatcher.tokens.UNTERMINATED_DQSTRING);
        token.text.should.equal(str);
        token.pos.should.equal(0);
        tape.pos.should.equal(str.length);
    });

    it('complains if DQS is not terminated and ends in escape', function () {
        var str = '"qwerty\\';
        var tape = new Tape(str);

        var token = dQStringMatcher.run(tape);
        token.type.should.be.exactly(dQStringMatcher.tokens.UNTERMINATED_ESCAPING_DQSTRING);
        token.text.should.equal(str);
        token.pos.should.equal(0);
        tape.pos.should.equal(str.length);
    });
});
