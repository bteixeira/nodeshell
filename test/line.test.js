require('should');

var util = require('util');
var LineReader = require('../src/line');
var streams = require('stream');

var DummyStream = function () {
    var args = [].slice(arguments, 0);
    DummyStream.super_.apply(this, args);
    this.columns = 80;
};
util.inherits(DummyStream, streams.Writable);
DummyStream.prototype._write = function () {};


describe('LineReader', function () {

    var output;
    var lineReader;

    beforeEach(function () {
        output = new DummyStream();
        lineReader = new LineReader(output);
    });

    it('should return the correct cursor position', function () {
        var prompt = '$> ';
        var text = 'texttexttext';
        lineReader.setPrompt(prompt);
        lineReader.insert(text);
        var pos = lineReader.getCursorPos();
        pos.cols.should.be.exactly(prompt.length + text.length);
        pos.rows.should.be.exactly(0);
    });

    describe('Word boundaries', function () {

        beforeEach(function () {
            var text = 'ABBA PIERCE_BROSNAN ABBA';
            lineReader.insert(text);
            lineReader.cursor = Math.round(text.length / 2);
        });

        it('should delete word to the left correctly', function () {
            lineReader.deleteWordLeft();
            lineReader.getLine().should.equal('ABBA BROSNAN ABBA');
            lineReader.cursor.should.be.exactly(5);
        });

        it('should delete word to the right correctly', function () {
            lineReader.deleteWordRight();
            lineReader.getLine().should.equal('ABBA PIERCE_ABBA');
            lineReader.cursor.should.be.exactly(12);
        });

    });

});
