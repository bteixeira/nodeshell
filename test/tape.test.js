var assert = require('assert');
var Tape = require('../dist/tape').default;
var should = require('should');

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
        assert.equal(tape.pos, 1);
    });

    it('also moves back to the previous character', function () {
        tape.next();
        assert.equal(tape.prev(), test.charAt(1));
        assert.equal(tape.peek(), test.charAt(0));
        assert.equal(tape.pos, 0);
    });

    it('skips white-space', function () {
        tape.pos = 4;
        tape.skipWS();
        assert.equal(tape.pos, 14);
    });

    it('skips non-white-space', function () {
        tape.skipNonWS();
        assert.equal(tape.pos, 4);
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

    it('skips to character matched by filter function', function () {
        tape.skipTo(function (ch) {
            return ch === '_';
        });
        assert.equal(tape.pos, 14);
    });

    it('keeps track of single mark', function () {
        tape.pos = 19;
        tape.setMark();
        tape.next();
        tape.next();
        var marked = tape.getMarked();
        assert.equal(marked, '96');
    });

    it('remembers multiple marks', function () {
        tape.pos = 3;
        tape.setMark();
        tape.pushMark();
        for (i = 0 ; i < 11 ; i++) {
            tape.next();
        }
        tape.setMark();
        for (i = 0 ; i < 3 ; i++) {
            tape.next();
        }
        var marked = tape.getMarked();
        assert.equal(marked, test.substring(14, 17));
        tape.popMark();
        marked = tape.getMarked();
        assert.equal(marked, test.substring(3, 17));
    });

    it('also supports arrays of objects', function (){
        var arr = [{
            name: 'Cave',
            id: 1
        }, {
            name: 'Caroline',
            id: 2
        }, {
            name: 'Chell',
            id: 1498
        }, {
            name: 'Ratman',
            id: -1
        }, {
            name: 'GLaDOS',
            id: 2
        }];

        tape = new Tape(arr);

        tape.skipTo(function (char) {
            return char.id > 10;
        });

        tape.setMark();

        assert.equal(tape.pos, 2);
        tape.next();
        tape.next();
        assert.equal(tape.pos, 4);

        var marked = tape.getMarked();

        assert.equal(marked.length, 2);
        assert.equal(marked[0].name, 'Chell');
        assert.equal(marked[1].name, 'Ratman');
        assert.equal(tape.hasMore(), true);
        assert.equal(tape.pos, 4);
    });

    it('casts objects to string when doing string operations', function () {
        var arr = [
            { toString: function () { return '';} },
            { toString: function () { return '   ';} },
            { toString: function () { return '\t';} },
            { toString: function () { return '\r\n';} },
            { toString: function () { return 'aa';} },
            { toString: function () { return 'aaa';} },
            { toString: function () { return ' ';} },
            { toString: function () { return 'bbb';} },
            { toString: function () { return 'bb';} },
            { toString: function () { return 'cccc';} }
        ];

        tape = new Tape(arr);

        tape.skipWS();
        tape.pos.should.be.exactly(4);
        tape.skipNonWS();
        tape.pos.should.be.exactly(6);
        tape.next();
        tape.skipTo(/c+/);
        tape.pos.should.be.exactly(9);
    });

    it('returns EOF when there are no more items', function () {
        while (tape.hasMore()) {
            tape.next();
        }
        var item = tape.next();
        item.should.be.exactly(Tape.EOF);
    });

    it('returns the current mark when popping it', function () {
        tape.setMark();
        tape.pos = 3;
        tape.pushMark();
        tape.setMark();
        var pos = tape.popMark();
        pos.should.equal(3);
    });

});
