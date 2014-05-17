require

var stdin = process.stdin;

emitKeypressEvents(stdin);

stdin.setRawMode(true);

var keyHandler = new KeyHandler({
    input: stdin,
    output: process.stdout
});

stdin.on('keypress', keyHandler.handleKey);

runUserFile();
