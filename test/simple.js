var Story = require('../dist/ink.cjs.js').Story;
var fs = require('fs');

var hello = fs.readFileSync(__dirname + '/stories/choice.ink.json', 'UTF-8');

var s = new Story(hello);

//console.log(s.canContinue);
console.log(s.Continue());
//console.log(s.canContinue);
while (s.canContinue){
	console.log(s.Continue());
}

if (s.currentChoices.length > 0){
	for (var i = 0; i < s.currentChoices.length; ++i) {
        var choice = s.currentChoices[i];
//		console.log(choice);
//		console.log(choice.text);
		console.log((i + 1) + ". " + choice.text);
    }
}