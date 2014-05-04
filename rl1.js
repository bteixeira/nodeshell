var readline = require('readline');
var rl = readline.createInterface(process.stdin, process.stdout);
var vm = require('vm');

function getPrompt() {
	/* Due to apparent bug in readline, if you want a new line before the prompt
	 * you should print it directly. Otherwise when you press backspace an
	 * aditional new line will be printed. */
	console.log();
	return process.cwd() + '$ ';
}

rl.setPrompt(getPrompt());
rl.prompt();

rl.on('line', function(line) {
	/*
	switch(line.trim()) {
	case 'hello':
		console.log('world!');
		break;
	default:
		console.log('Say what? I might have heard `' + line.trim() + '`');
		break;
	}
	*/
	//var result = parse(line);
	var result = runLine(line);
	console.log(result);
	rl.setPrompt(getPrompt());
	rl.prompt();
}).on('close', function() {
	console.log('\nHave a great day!');
	process.exit(0);
});

function cd (dir) {
	process.chdir(dir);
}

function getCmd (cmd) {
	if (cmd === 'cd') {
		return cd;
	}
}

function parse (line) {
	//console.log('parsing:', line);
	line = line.trim();
	var fn;
	try {
		// This is here so that the text is parsed before being executed. Probably the execution after already does pre-parsing? */
		fn = new Function(line);
		console.log('input seems ok, evaling');
		//return eval(line);
		return vm.runInThisContext(line, 'panda');
	} catch (ex) {
		console.log('no JS, getting command');
		var tokens = line.split(/\s+/);
		fn = getCmd(tokens[0]);
		if (!fn) {
			console.log('Input is no valid Javascript nor command');
			return;
		}
		var args = [];
		var arg;
		for (var i = 1 ; i < tokens.length ; i++) {
			try {
				new Function(tokens[i]);
				//arg = eval(tokens[i]);
				arg = vm.runInThisContext(tokens[i], 'panda2');
			} catch (e) {
				arg = tokens[i];
			}
			args.push(arg);
		}
		return fn.apply(null, args);
	}
	/* first try -- good one
	var tokens = line.split(/\s+/);
	if (tokens[0] === 'cd') {
		process.chdir(tokens[1]);
	} else {
		try {
			console.log(eval(line));
		} catch (ex) {
			console.log(ex.toString());
		}
	}
	*/
}

var words = [
	'break','case','catch','continue','debugger','default','delete','do','else',
	'finally','for','function','if','in','instanceof','new','return','switch',
	'this','throw','try','typeof','var','void','while','with'];

var START = 'START';
var IDENTIFIER = 'IDENTIFIER';
var NUMBER = 'NUMBER';
var SQ_STRING = 'SQ_STRING';
var DQ_STRING = 'DQ_STRING';
var REGEXP = 'REGEXP';

/**/
function tokenize (line) {
	var state = START;
	var nesting = [];
	var parts = []; // To return. Array of objects type+string, where type can be literal or js
	var i, c, id, prev;
	var first = true;
	for (i = 0 ; i < line.length ; i++) {
		c = line.charAt(i);
		if (state === START) {
			if (c === ' ') { // TODO generalize whitespace
			} else if (c === '"') {
				state = DQ_STRING;
			} else if (c === "'") {
				state = SQ_STRING);
			} else if ('({['.indexOf(c) !== -1) {
				nesting.append(c);
			} else { // Everything else is identifier/reserver word.
				state = IDENTIFIER;
				id = c;
			}
			// TODO Regexp
			// TODO illegals, such as )}]
		} else if (state === IDENTIFIER) {
			if (c === ' ') { // TODO generalize whitespace
				if (words.indexOf(id) !== -1) {
					prev = 'RESERVED';
					first = false;
				} else {
					if (prev === IDENTIFIER && first) {
						
					prev = IDENTIFIER;
				}
				state = START;
			} else if ('=|+-/*!&%><?^,:;.'.indexOf(c) !== -1) {
				state = START; // for now we dont care about storing operators
				prev = false;
			} else {
				id += c;
			}
			// TODO illegals, such as '"
		}
/**/

function runLine (line) {
	var match = line.match(/^[a-zA-Z_0-9]+\s*/);
	var cmd;
	if (match && (cmd = getCmd(match[0].trim()))) {
		// parse rest of line for JS expressions separated by WS, or literals
		var args = findArguments(line.substr(match[0].length));
		// run command with found arguments
		args.map(function (val) {
			//if (val.type === 'js') {
			//	return eval(val.text);
			//} else if (val.type === 'single') { // single identifier argument, could be var or literal
				try {
					//return eval(val.text);
					return eval(val);
				} catch (e) {
					//return val.text;
					return val;
				}
			//}
		});
		return cmd.apply(null, args);
	} else {
		//run whole line as JS
		return eval(line);
	}
}

function findArguments (line) {
	
