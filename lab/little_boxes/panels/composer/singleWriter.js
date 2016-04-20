var rl = require('readline');

// TODO TEST

module.exports = function (stdout) {

    var content = [];
    var row = 1;
    var col = 1;

    return {
        getHeight: function () {
            return row;
        },

        reserveSpace: function () {
            // Nothing?
        },

        rewrite: function () {
            this.rewind();
            var me = this;
            row = col = 1;
            content.forEach(function (ch) {
                me.insert(ch, true);
            });
            var diff = stdout.columns - col;
            stdout.write(new Array(diff + 2).join(' '));
            rl.moveCursor(stdout, -diff, 0);
        },

        insert: function (ch, skipChecks) {
            if (ch.charCodeAt(0) === 127) {
                if (col > 1) {
                    stdout.write(ch);
                    stdout.write(' ');
                    stdout.write(ch);
                    col -= 1;
                    content.splice(content.length - 1, 1);
                }
            } else {
                stdout.write(ch);
                if (!skipChecks) {
                    content.push(ch);
                }
                col += 1;
                var width = stdout.columns;
                if (col > width) {
                    col = 1;
                    row += 1;
                    stdout.write(new Array(2).join('\n'));
                }
            }
        },

        rewind: function () {
            rl.moveCursor(stdout, -col + 1, -row + 1);
        },

        activate: function () {
           // Nothing?
        }
    };
};
