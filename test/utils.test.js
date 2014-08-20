require('should');
var utils = require('../src/utils');

describe('Utils', function () {

    describe('Function Detection', function () {

        it('should correctly identify inline functions', function () {
            var result = utils.isFunction(function () {});
            result.should.be.true;
        });

        it('should correctly identify constructed functions', function () {
            var fun = new Function('return 42;');
            var result = utils.isFunction(fun);
            result.should.be.true;
        });

        it('should not identify RegExp object as function', function () {
            var regex = new RegExp('[a-z]+');
            var result = utils.isFunction(regex);
            result.should.be.false;
        });

        it('should not identify inline regex as function', function () {
            var result = utils.isFunction(/abc/g);
            result.should.be.false;
        });

    });

});
