require('should');

var util = require('util');
var LineReader = require('../src/lineReader');
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

    describe('Character Counting', function () {
        it('should be able to count the length of a simple string', function () {
            LineReader.countLength('$> ').should.be.exactly(3);
        });
    });

    describe('Cursor Positioning', function () {
        it('should return the correct cursor position', function () {
            var prompt = '$> ';
            var text = 'texttexttext';
            lineReader.setPrompt(prompt).updatePrompt();
            lineReader.insert(text);
            var pos = lineReader.getCursorPos();
            pos.cols.should.be.exactly(prompt.length + text.length);
            pos.rows.should.be.exactly(0);
        });

        it('should return zeros when the cursor is home', function () {
            var prompt = '';
            lineReader.setPrompt(prompt).updatePrompt();
            var pos = lineReader.getCursorPos();
            pos.cols.should.be.exactly(0);
            pos.rows.should.be.exactly(0);
        });

        it('should return the correct cursor position even for multi-line prompts', function () {
            var prompt = '[ what a nice day ]\n$> ';
            var text = 'texttexttext';
            lineReader.setPrompt(prompt).updatePrompt();
            lineReader.insert(text);
            var pos = lineReader.getCursorPos();
            pos.cols.should.be.exactly(prompt.split(/[\n\r]/).slice(-1)[0].length + text.length);
            pos.rows.should.be.exactly(1);
        });
    });

    describe('Cursor Movement', function () {
        it('should move to start', function () {
            lineReader.insert('texttexttext');
            lineReader.moveToStart();
            lineReader.cursor.should.be.exactly(0);
        });
    });

    describe('Word Boundaries', function () {

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
