var chainMatcher = require('../../../dist/tokenizer/matchers/chainMatcher');
var Tape = require('../../../dist/tape').default;

describe('Matcher for command chains', function () {

    it('fails if tape is not positioned at neither & nor |', function () {
        var tape = new Tape('   & ');
        var token = chainMatcher.run(tape);
        token.type.should.be.exactly(chainMatcher.TOKENS.NOT_CHAIN);
    });

    it('moves the tape to just after &', function () {
        var str = 'mvn install & something else';
        var tape = new Tape(str);
        tape.pos = 12;
        var token = chainMatcher.run(tape);
        token.type.should.be.exactly(chainMatcher.TOKENS.AMP);
        token.text.should.equal(str.slice(12, 13));
        token.pos.should.equal(12);
        tape.pos.should.equal(13);
    });

    it('moves the tape to just after |', function () {
        var str = 'ls -l | grep .js';
        var tape = new Tape(str);
        tape.pos = 6;
        var token = chainMatcher.run(tape);
        token.type.should.be.exactly(chainMatcher.TOKENS.PIPE);
        token.text.should.equal(str.slice(6, 7));
        token.pos.should.equal(6);
        tape.pos.should.equal(7);
    });

    it('moves the tape to just after &&', function () {
        var str = 'mvn install && something else';
        var tape = new Tape(str);
        tape.pos = 12;
        var token = chainMatcher.run(tape);
        token.type.should.be.exactly(chainMatcher.TOKENS.DAMP);
        token.text.should.equal(str.slice(12, 14));
        token.pos.should.equal(12);
        tape.pos.should.equal(14);
    });

    it('moves the tape to just after ||', function () {
        var str = 'mvn deploy ||';
        var tape = new Tape(str);
        tape.pos = 11;
        var token = chainMatcher.run(tape);
        token.type.should.be.exactly(chainMatcher.TOKENS.DPIPE);
        token.text.should.equal(str.slice(11, 13));
        token.pos.should.equal(11);
        tape.pos.should.equal(13);
    });

});
