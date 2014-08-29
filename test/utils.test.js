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

    describe('Other Types Detection', function () {

        it('should identify inline array', function () {
            var result = utils.isArray([]);
            result.should.be.true;
        });

        it('should not identify fake array', function () {
            var fake = {
                length: 42,
                toString: function () {
                    return '[object Array]';
                }
            };
            var result = utils.isArray(fake);
            result.should.be.false;
        });

    });

});
