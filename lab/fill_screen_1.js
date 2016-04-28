/* Fill the screen with the X character by printing one character a time */

var stdin = process.stdin;
stdin.setRawMode(true);

var stdout = process.stdout;

var readline = require('readline');
readline.cursorTo(stdout, 0, 0);
readline.clearScreenDown(stdout);

var total = stdout.columns * stdout.rows;

var microtime = require('microtime');

var i = 0;
var now = microtime.now();

for (; i < total ; i++) {
    stdout.write('X');
}

var ellapsed = microtime.now() - now;
stdout.write('' + ellapsed + 'us\n');

/* 25000us ~ 30000us (up to 30ms) */