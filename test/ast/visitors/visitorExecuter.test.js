require('should');

var Executer = require('../../../dist/ast/visitors/visitorExecuter').default;
var NodeLiteral = require('../../../dist/ast/nodes/nodeLiteral');
var path = require('path');

describe('VisitorExecuter', function () {

    var executer = new Executer(/* commandSet, context */);

    describe('Home dir expansions', function () {

        var TEST_STRING = 'TEST1044';
        var oldHome;
        var homeVar = (process.platform === 'win32') ? 'USERPROFILE' : 'HOME';

        before(function () {
            oldHome = process.env[homeVar];
            process.env[homeVar] = TEST_STRING;
        });

        after(function () {
            process.env[homeVar] = oldHome;
        });

        it('should expand home dir', function (done) {
            var token = new NodeLiteral('~');

            executer.visit(token, function (value) {
                value.should.equal(TEST_STRING);
                done();
            });
        });

        it('should expand path with home dir', function (done) {
            var dir = path.sep + 'directory_name';
            var token = new NodeLiteral('~' + dir);

            executer.visit(token, function (value) {
                value.should.equal(TEST_STRING + dir);
                done();
            });
        });

        it('Should not expand leading tilde if not in a path', function (done) {
            var text = '~lalala';

            executer.visit(new NodeLiteral(text), function (value) {
                value.should.equal(text);
                done();
            });
        });
    });
});
