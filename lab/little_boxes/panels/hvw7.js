/* Yet another iteration */
/* Simply trying to refactor what works into something that makes sense */

var stdout = process.stdout;
var stdin = process.stdin;

stdin.setRawMode(true);

require('colors');

var rl = require('readline');

rl.moveCursor(stdout, -stdout.columns, 0);

var KeyHandler = require('../../../src/keyhandler');
var keyHandler = new KeyHandler(stdin);

keyHandler.bind('CTRL+C', function () {
    rl.moveCursor(stdout, -stdout.columns, 0);
    rl.clearScreenDown(stdout);
    process.exit(0);
});

keyHandler.bindDefault(function (ch, key) {
    if (ch && ch.length === 1) {
        writers[activeI].insert(ch); // TODO MUST BE SURE IT'S THE ACTIVE PANEL, FIND MORE ELEGANT WAY
    }
});

keyHandler.bind('TAB', function (ch, key) {
    switchPanel();
});

var activeI = 0;
function switchPanel() {
    activeI = (activeI + 1) % writers.length;
    writers[activeI].activate();
}
//var active;
//var linesAdded = 0;
//var oldFooterHeight = 0;

var Center = require('./center');

var Footer = require('./footer');

var Columns = require('./cols');

var Rows = require('./rows');

var Writer = require('./writer');




var w1 = new Writer(stdout);
var w2 = new Writer(stdout);
var w3 = new Writer(stdout);
var w4 = new Writer(stdout);
var w5 = new Writer(stdout);
var w6 = new Writer(stdout);
var rowsTop = new Rows([w2, w1, w3]);
var colsTop = new Columns([w4, rowsTop, w5, w6], [20, 40, 'auto', 20], stdout);

var w11 = new Writer(stdout);
var w12 = new Writer(stdout);
var w13 = new Writer(stdout);
var w14 = new Writer(stdout);
var rowsBottom1 = new Rows([w11, w12]);
var rowsBottom2 = new Rows([w13, w14]);
var colsBottom = new Columns([rowsBottom2, rowsBottom1], [40, 'auto'], stdout);
var footer = new Footer(colsBottom, stdout);

var center = new Center(colsTop, stdout, footer);

var writers = [w1, w2, w3, w4, w5, w6, w11, w12, w13, w14];
writers.forEach(function (w) {
    w.setFooter(footer);
});

center.reserveSpace();

activeI = 0;
w1.activate();