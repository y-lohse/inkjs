#!/usr/bin/env node

var spawn = require('child_process').spawn;

var command = '';

switch (process.platform){
	case 'darwin':
		command = './' + __dirname + '/inklecate';
		break;
	case 'win32':
		command = __dirname + '/inklecate.exe';
		break;
	default:
		command = 'mono ' + __dirname + '/inklecate.exe';
		break;
}

var child = spawn(command, process.argv);

process.stdin.pipe(child.stdin);

child.stdout.on('data', function(chunk){
	console.log(chunk.toString());
});

child.stderr.on('data', function(chunk){
	console.warn(chunk.toString());
	process.exit();
});

child.on('exit', function(){
	process.exit();
});