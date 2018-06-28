var should = require('should');
var CLT = require('../../dist/tokenizer/commandLineTokenizer').default;
var Tape = require('../../dist/tape').default;

describe('Command Line Tokenizer', function () {

    it('tokenizes line with single command [git]', function () {
        var tokens = CLT('git');
        tokens.length.should.be.exactly(1);
        tokens[0].type.id.should.equal('GLOB');
    });

});
