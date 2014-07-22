var assert = require('assert');
var Pointer = require('../../src/parser/linePointer');

describe('LinePointer', function () {

    var test = 'AAAA   \t\t  \n\r\t_gkRg96sd4#4123';
    var pointer;

    beforeEach(function() {
        pointer = new Pointer(test);
    });

    it('is initialized to the first character', function () {
        assert.equal(pointer.peek(), test.charAt(0));
    });

    it('moves to the next character', function () {
        assert.equal(pointer.next(), test.charAt(0));
        assert.equal(pointer.peek(), test.charAt(1));
    });

    it('skips to one of the characters in string', function () {
        pointer.pos = 4;
        pointer.skipTo('#abcABC_0123456789');
        assert.equal(pointer.pos, 14);
    });

    it('skips to one of the characters matched by regEx', function () {
        pointer.skipTo(/[0-9]/);
        assert.equal(pointer.pos, 19);
    });

});
