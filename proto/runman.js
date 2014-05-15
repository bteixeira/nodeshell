var spawn = require('child_process').spawn;
spawn('man', ['git'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit'
});
// !!! WORKS !!!
