var fs = require('fs');

var out = fs.createWriteStream('/home/bruno/tmp/lalala.txt');

process.stdin.on('data', function(buf) {
    out.write(buf);
});
