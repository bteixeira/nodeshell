/* TODO: This won't actually work in a real scenario if readline::emitKeys is involved (or potentially any other 'data'
   listener on stdin). The reason is that stdin will receive a sequence in the format `ESC[12;345R` (12 and 345) being
   the coordinates) and readline's algorithm will only extract two characters after the ";". So it will emit one
   'keypress' event with `ESC[12;34` (key name 'undefined') and two other as normal keypresses, "5" and "R".

   It's probably better to temporarily disable ALL 'data' listeners on stdin and enable them again after receiving the
   coords.

   UPDATE: that also doesn't work in the case when multiple characters are already waiting on the input stream... It
   seems getting the cursor pos is a bad idea all around. Better to move the cursor to a known location at start-up and
   then keep track of it.
 */

process.stdin.on('data', function (data) {

    var coords = data.toString().slice(2).split(';').map(parseFloat);

    console.log(coords);

    process.stdin.end();
});

process.stdin.setRawMode(true);
process.stdout.write('\033[6n');
