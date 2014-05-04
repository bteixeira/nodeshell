var repl = require('repl');
var util = require('util');

function shellParser(code, context, filename, callback) {
	//console.log('this is an experimental parser.');
	//console.log(cmd);
	
	var err, result;
	try {
		//eval.apply(null, arguments);
		//callback(null, eval(code));
		result = eval(code);
	} catch (ex) {
		//console.log(ex.toString());
		err = ex;
	}
	callback(err, result);
}

/*
function lol(code, context, file, cb) {
    var err, result;
    try {
      if (self.useGlobal) {
        result = vm.runInThisContext(code, file);
      } else {
        result = vm.runInContext(code, context, file);
      }
    } catch (e) {
      err = e;
    }
    if (err && process.domain) {
      process.domain.emit('error', err);
      process.domain.exit();
    }
    else {
      cb(err, result);
    }
  };
  */

/**/
repl.start({
	prompt: 'here PS1> ',
	input: process.stdin,
	output: process.stdout,
	terminal: true,
	//eval: shellParser,
	//useColors: true,
	//useGlobal: false,
	ignoreUndefined: false,
	writer: util.inspect
}).context.repl = repl;
/**/

// get cwd: process.cwd()
// move cursor: function omg() {rl.cursorTo(process.stdout, 4, 11);console.log('HIHIHI');}

//repl.start({prompt: 'ohhi! '});
//repl.start("node > ").context.foo = "stdin is fun";