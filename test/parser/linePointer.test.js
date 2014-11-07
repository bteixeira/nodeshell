var assert = require('assert');
var Tape = require('../../src/tape');

describe('Tape', function () {

    var test = 'AAAA   \t\t  \n\r\t_gkRg96sd4#4123';
    var tape;

    beforeEach(function() {
        tape = new Tape(test);
    });

    it('is initialized to the first character', function () {
        assert.equal(tape.peek(), test.charAt(0));
    });

    it('moves to the next character', function () {
        assert.equal(tape.next(), test.charAt(0));
        assert.equal(tape.peek(), test.charAt(1));
    });

    it('skips to one of the characters in string', function () {
        tape.pos = 4;
        tape.skipTo('#abcABC_0123456789');
        assert.equal(tape.pos, 14);
    });

    it('skips to one of the characters matched by regEx', function () {
        tape.skipTo(/[0-9]/);
        assert.equal(tape.pos, 19);
    });

});
