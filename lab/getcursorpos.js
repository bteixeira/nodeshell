
process.stdin.on('data', function (data) {

    var coords = data.toString().slice(2).split(';').map(parseFloat);

    console.log(coords);

    process.stdin.end();
});

process.stdin.setRawMode(true);
process.stdout.write('\033[6n');
