var redirMatcher = require('../../../dist/tokenizer/matchers/redirMatcher');
var Tape = require('../../../dist/tape').default;
var assert = require('assert');

describe('Matcher for redirections', function () {

	it('fails if tape is not positioned at neither digit nor > nor <', function () {
		var tape = new Tape('echo "stuff" > out.txt ');
		var token = redirMatcher.run(tape);
		token.type.should.be.exactly(redirMatcher.tokens.NOTREDIR);
	});

	it('moves the tape to just after >', function () {
		var str = 'echo "stuff" > out.txt ';
		var tape = new Tape(str);
		tape.pos = 13;
		var token = redirMatcher.run(tape);
		token.type.should.be.exactly(redirMatcher.tokens.GT);
		token.text.should.equal(str.slice(13, 14));
		assert(!token.fd);
		token.pos.should.equal(13);
		tape.pos.should.equal(14);
	});

	it('moves the tape to just after ([0-9]+)>', function () {
		var str = 'echo "stuff" 19> out.txt ';
		var tape = new Tape(str);
		tape.pos = 13;
		var token = redirMatcher.run(tape);
		token.type.should.be.exactly(redirMatcher.tokens.GT);
		token.text.should.equal(str.slice(13, 16));
		token.fd.should.equal(str.slice(13, 15));
		token.pos.should.equal(13);
		tape.pos.should.equal(16);
	});

	it('moves the tape to just after <', function () {
		var str = 'unzip < msoffice.zip ';
		var tape = new Tape(str);
		tape.pos = 6;
		var token = redirMatcher.run(tape);
		token.type.should.be.exactly(redirMatcher.tokens.LT);
		token.text.should.equal(str.slice(6, 7));
		assert(!token.fd);
		token.pos.should.equal(6);
		tape.pos.should.equal(7);
	});

	it('moves the tape to just after ([0-9]+)<', function () {
		var str = 'weirdunzip 777< msoffice.zip ';
		var tape = new Tape(str);
		tape.pos = 11;
		var token = redirMatcher.run(tape);
		token.type.should.be.exactly(redirMatcher.tokens.LT);
		token.text.should.equal(str.slice(11, 15));
		token.fd.should.equal(str.slice(11, 14));
		token.pos.should.equal(11);
		tape.pos.should.equal(15);
	});

	it('moves the tape to just after >>', function () {
		var str = 'echo "stuff" >> out.txt ';
		var tape = new Tape(str);
		tape.pos = 13;
		var token = redirMatcher.run(tape);
		token.type.should.be.exactly(redirMatcher.tokens.GTGT);
		assert(!token.fd);
		token.text.should.equal(str.slice(13, 15));
		token.pos.should.equal(13);
		tape.pos.should.equal(15);
	});

	it('moves the tape to just after ([0-9]+)>>', function () {
		var str = 'echo "stuff" 19>> out.txt ';
		var tape = new Tape(str);
		tape.pos = 13;
		var token = redirMatcher.run(tape);
		token.type.should.be.exactly(redirMatcher.tokens.GTGT);
		token.text.should.equal(str.slice(13, 17));
		token.fd.should.equal(str.slice(13, 15));
		token.pos.should.equal(13);
		tape.pos.should.equal(17);
	});

	it('moves the tape to just after >&', function () {
		var str = 'danger >& out.txt ';
		var tape = new Tape(str);
		tape.pos = 7;
		var token = redirMatcher.run(tape);
		token.type.should.be.exactly(redirMatcher.tokens.GTAMP);
		token.text.should.equal(str.slice(7, 9));
		assert(!token.fd);
		token.pos.should.equal(7);
		tape.pos.should.equal(9);
	});

	it('moves the tape to just after ([0-9]+)>&', function () {
		var str = 'danger 999>& out.txt ';
		var tape = new Tape(str);
		tape.pos = 7;
		var token = redirMatcher.run(tape);
		token.type.should.be.exactly(redirMatcher.tokens.GTAMP);
		token.text.should.equal(str.slice(7, 12));
		token.fd.should.equal(str.slice(7, 10));
		token.pos.should.equal(7);
		tape.pos.should.equal(12);
	});

	it('moves the tape to just after <>', function () {
		var str = 'mycmd <> data.txt ';
		var tape = new Tape(str);
		tape.pos = 6;
		var token = redirMatcher.run(tape);
		token.type.should.be.exactly(redirMatcher.tokens.LTGT);
		token.text.should.equal(str.slice(6, 8));
		assert(!token.fd);
		token.pos.should.equal(6);
		tape.pos.should.equal(8);
	});

	it('moves the tape to just after ([0-9]+)<>', function () {
		var str = 'mycmd 3<> data.txt';
		var tape = new Tape(str);
		tape.pos = 6;
		var token = redirMatcher.run(tape);
		token.type.should.be.exactly(redirMatcher.tokens.LTGT);
		token.text.should.equal(str.slice(6, 9));
		token.fd.should.equal(str.slice(6, 7));
		token.pos.should.equal(6);
		tape.pos.should.equal(9);
	});

	it('moves the tape to just after <&', function () {
		var str = 'mycmd <& data.txt ';
		var tape = new Tape(str);
		tape.pos = 6;
		var token = redirMatcher.run(tape);
		token.type.should.be.exactly(redirMatcher.tokens.LTAMP);
		token.text.should.equal(str.slice(6, 8));
		assert(!token.fd);
		token.pos.should.equal(6);
		tape.pos.should.equal(8);
	});

	it('moves the tape to just after ([0-9]+)<&', function () {
		var str = 'mycmd 1000<& data.txt';
		var tape = new Tape(str);
		tape.pos = 6;
		var token = redirMatcher.run(tape);
		token.type.should.be.exactly(redirMatcher.tokens.LTAMP);
		token.text.should.equal(str.slice(6, 12));
		token.fd.should.equal(str.slice(6, 10));
		token.pos.should.equal(6);
		tape.pos.should.equal(12);
	});

});
