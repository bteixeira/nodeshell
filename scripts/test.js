var fs = require('fs');
var path = require('path');
var istanbul = require('istanbul');
var Mocha = require('mocha');

/**
 * Applies a function to all files in a directory, recursively (does not apply callback to dirs)
 */
function allFiles(root, callback) {
    fs.readdirSync(root).forEach(function (filename) {
        var fullPath = root + path.sep + filename;
        var stats = fs.statSync(fullPath);
        if (stats.isFile()) {
            callback(fullPath);
        } else if (stats.isDirectory()) {
            allFiles(fullPath, callback);
        }
    });
}

/** List of source files */
var src = {};

allFiles('src', function (filename) {
    if (/\.js$/.test(filename)) {
        src[path.resolve(filename)] = true;
    }
});


var mocha = new Mocha;

// Add all files in /test to mocha
allFiles('test', function (filename) {
    if (/\.js$/.test(filename)) {
        mocha.addFile(filename);
    }
});

// istanbul works with this global, I think it is possible to get rid of it but couldn't figure it out
var coverageVar = '$$cov_' + new Date().getTime() + '$$';
var instrumenter = new istanbul.Instrumenter({
    coverageVariable: coverageVar,
    preserveComments: true
});
var transformer = instrumenter.instrumentSync.bind(instrumenter);

istanbul.matcherFor({
        root: 'src',
        includes: [ '**/*.js' ]
    },
    function (err, matchFn) {
        if (err) {
            throw err;
        }

        istanbul.hook.hookRequire(matchFn, transformer, {
            postLoadHook: function (file) {
                delete src[file];
            }
        });

        mocha.run(function finish() {
            istanbul.hook.unhookRequire();

            if (typeof global[coverageVar] === 'undefined' || Object.keys(global[coverageVar]).length === 0) {
                console.error('No coverage information was collected, exit without writing coverage information');
                return;
            }

            // For merging reports
            var collector = new istanbul.Collector();
            collector.add(global[coverageVar]);

            // BaselineCollector approach copied from the "instrument" command in istanbul
            function BaselineCollector(instrumenter) {
                this.instrumenter = instrumenter;
                this.collector = new istanbul.Collector();
                this.instrument = instrumenter.instrument.bind(this.instrumenter);

                var origInstrumentSync = instrumenter.instrumentSync;
                this.instrumentSync = function () {
                    var args = Array.prototype.slice.call(arguments),
                        ret = origInstrumentSync.apply(this.instrumenter, args),
                        baseline = this.instrumenter.lastFileCoverage(),
                        coverage = {};
                    coverage[baseline.path] = baseline;
                    this.collector.add(coverage);
                    return ret;
                };
                //monkey patch the instrumenter to call our version instead
                instrumenter.instrumentSync = this.instrumentSync.bind(this);
            }

            BaselineCollector.prototype = {
                getCoverage: function () {
                    return this.collector.getFinalCoverage();
                }
            };
            instrumenter = new BaselineCollector(instrumenter);

            // For each of the source files not required, instrument it and get its stats
            Object.keys(src).forEach(function (filename) {
                instrumenter.instrumentSync(fs.readFileSync(filename, 'utf8'), filename);
            });
            collector.add(instrumenter.getCoverage());

            // Get a new Istanbul reporter which outputs both summary and details, but to the console only
            var reporter = new istanbul.Reporter();
            reporter.addAll('text text-summary lcov json'.split(' '));
            reporter.write(collector, false, function () {}); // reporter seems to always need a callback
        });
    });
