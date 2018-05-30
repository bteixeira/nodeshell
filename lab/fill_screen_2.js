/* Fill the screen with the X character by printing a single string */

var stdin = process.stdin;
stdin.setRawMode(true);

var stdout = process.stdout;

var readline = require('readline');
readline.cursorTo(stdout, 0, 0);
readline.clearScreenDown(stdout);

var total = stdout.columns * stdout.rows;

var microtime = require('microtime');

var i = 0;

var str = new Array(total + 1).join('X');

var now = microtime.now();

stdout.write(str);

var ellapsed = microtime.now() - now;
stdout.write('' + ellapsed + 'us\n');

/* 70us ~ 100us (about 300x faster...) */