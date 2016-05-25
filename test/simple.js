var Story = require('../dist/ink.cjs.js');
var fs = require('fs');

var hello = fs.readFileSync(__dirname + '/stories/hello.ink.json', 'UTF-8');

console.log(hello);