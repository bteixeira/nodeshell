var charm = require('charm')();
//var events = require('events');

charm.pipe(process.stdout);
charm.reset();

charm.position(Math.floor(process.stdout.columns / 2), Math.floor(process.stdout.rows / 2));

var readline = require('readline');

var stdin = process.stdin;
readline.emitKeypressEvents(stdin);

stdin.on('keypress', function chachacha (ch, key) {
    if (key.ctrl && key.name === 'c') {
        // TODO check the right way to terminate and consider sending SIGINT
            process.stdin.end();
    }
    else if (['up', 'down', 'left', 'right'].indexOf(key.name) > -1) {
        charm[key.name](1);
    } else if (key.ctrl && key.name === 'p') {
        // TODO cannot pipe and then unpipe, dunno why. Consider writing and reading directly with stdio and not with charm
        process.stdin.once('data', function (buf) {
            charm.write(buf);
        });
        charm.position(function (x, y) {
            charm.position(1, 1);
            console.log('Position (%d,%d)', x, y);
            charm.position(x, y);
        });
    } else if (ch) {
        charm.write(ch);
    } else {
        console.dir(key);
    }
});

stdin.setRawMode(true);
