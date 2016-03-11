/**
 * Gives you power over your terminal like you never saw before.
 * Probably too much power...
 */


var stdout = process.stdout;
var stdin = process.stdin;
var coords = {};
getCoords(function (row, col) {
    coords.row = row;
    coords.col = col;
});

var nodeReadline = require('readline');
require('colors');

var KeyHandler = require('../src/keyhandler');



var keyHandler = new KeyHandler(stdin);

keyHandler.bind('UP', function () {
    nodeReadline.moveCursor(stdout, 0, -1);
});

keyHandler.bind('DOWN', function () {
    nodeReadline.moveCursor(stdout, 0, 1);
});

keyHandler.bind('LEFT', function () {
    nodeReadline.moveCursor(stdout, -1, 0);
});

keyHandler.bind('RIGHT', function () {
    nodeReadline.moveCursor(stdout, 1, 0);
    coords.col += 1;
    if (coords.col > stdout.columns) {
        coords.col = stdout.columns;
    }
});

keyHandler.bind('CTRL+C', function () {
    process.exit(0);
});

/*
keyHandler.bind('RETURN', function () {
    stdout.write('RETURN');
});

keyHandler.bind('ENTER', function () {
    stdout.write('ENTER');
});
*/

//var history = [];

function getCoords(cb) {



    //setImmediate(function () {
        var listeners = stdin.listeners('data');
        stdin.removeAllListeners('data');
        stdin.once('data', function (data) {
            //history.push(data);
            var coords = data.toString().slice(2).split(';').map(parseFloat);
            cb.apply(null, coords);
            //setTimeout(function () {
                listeners.forEach(function (listener) {
                    stdin.on('data', listener);
                });
            //}, 1);
        });
        stdout.write('\033[6n');
    //});



}



keyHandler.bind('CTRL+X', function () {
    getCoords(function (row, col) {
        nodeReadline.cursorTo(stdout, 0, 0);
        stdout.write('POS: ' + row + ' x ' + col + ' |');
        stdout.write('\033[K');
        nodeReadline.cursorTo(stdout, col - 1, row - 1);
    });
});

function saveCursor() {
    stdout.write('\033[s');
}

keyHandler.bind('CTRL+S', saveCursor);

function restoreCursor() {
    stdout.write('\033[u');
}

keyHandler.bind('CTRL+R', restoreCursor);

keyHandler.bindDefault(function (ch, key) {
    //var h = history;
    //if (ch && ch.length === 1) {
    //
    //    setImmediate(function () {
    //        var listeners = stdin.listeners('data');
    //        stdin.removeAllListeners('data');
    //        stdin.once('data', function (data) {
    //            stdout.write(ch);
    //            listeners.forEach(function (listener) {
    //                stdin.on('data', listener);
    //            });
    //        });
    //        stdout.write('\033[6n');
    //    });




    //    getCoords(function (row, col) {
    //        var h = history;
    //        stdout.write(ch);
    //        //if (col === stdout.columns) {
    //        //    stdout.write('\n');
    //        //}
    //    });

        //stdout.write(' ');
        //saveCursor();
        //stdout.write('\n');
        //stdout.write('string');
        //process.stdin.once('data', function (data) {
        //    var coords = data.toString().slice(2).split(';').map(parseFloat);
        //    saveCursor();
        //    nodeReadline.cursorTo(stdout, 0, stdout.rows - 1);
        //    process.stdout.write('' + coords[0] + 'x' + coords[1]);
        //    restoreCursor();
        //});
        //process.stdout.write('\033[6n');
        //stdout.write('\n');
        //forceRedraw();

        //nodeReadline.moveCursor(stdout, 0, 1);
        //nodeReadline.moveCursor(stdout, 0, -1);
        //stdout.write('\033[K');
    //}

    if (ch && ch.length === 1) { // TODO CAN `ch` EVER BE LONGER THAN 1?
        stdout.write(ch);
        coords.col += ch.length;
        var first = true;
        if (coords.col > stdout.columns) {
            coords.col -= stdout.columns;
            stdout.write('\n\n');
            nodeReadline.moveCursor(stdout, 0, -1);
            stdout.write('\033[K');
            forceRedraw();
            //coords.row += 1;
            //if (coords.row > stdout.rows) {
            //    coords.row = stdout.rows;
            //}
        }
    }



});



function safeDraw() {
    saveCursor();
    nodeReadline.cursorTo(stdout, 0, stdout.rows - 1);
    stdout.write(new Date().toString().black.redBG);
    restoreCursor();
}
safeDraw();
var id = setInterval(safeDraw, 1000);

function forceRedraw() {
    clearInterval(id);
    safeDraw();
    id = setInterval(safeDraw, 1000);
}