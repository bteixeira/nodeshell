var should = require('should');
var commandLineTokenizer = require('../../dist/tokenizer/commandLineTokenizer').default;
var Tape = require('../../dist/tape').default;
var globMatcher = require('../../dist/tokenizer/matchers/globMatcher');

describe('Command Line Tokenizer', function () {

	it('tokenizes line with single command [git]', function () {
		var tokens = commandLineTokenizer('git');
		tokens.length.should.be.exactly(1);
		tokens[0].type.should.equal(globMatcher.tokens.GLOB);
	});

});
