var Story = require('../dist/ink.cjs.js').Story;
var fs = require('fs');

var hello = fs.readFileSync(__dirname + '/stories/hello.ink.json', 'UTF-8');

var s = new Story(hello);

//while (s.canContinue){
//	console.log(s.Continue());
//}