var charm = require('charm')();

charm.pipe(process.stdout);
charm.reset();

charm.position(Math.floor(process.stdout.columns / 2), Math.floor(process.stdout.rows / 2));

process.stdin.on('data', function (buf) {
    asdasd.sss();
    process.exit();
    console.log('lalal');
    var str = buf.toString('utf8');
    if (str.indexOf('a') === 0) {
        charm.position(1, 1);
    }
});
