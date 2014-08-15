var encode = module.exports = function (xs) {
    function bytes (s) {
        if (typeof s === 'string') {
            return s.split('').map(ord);
        }
        else if (Array.isArray(s)) {
            return s.reduce(function (acc, c) {
                return acc.concat(bytes(c));
            }, []);
        }
    }

    return new Buffer([ 0x1b ].concat(bytes(xs)));
};

var ord = encode.ord = function ord (c) {
    return c.charCodeAt(0)
};

process.stdin.setRawMode(true);
process.stdout.write(encode('[6n'));
process.stdin.on('data', function (data) {
    console.log('here', data.toString());
    process.exit();
});
