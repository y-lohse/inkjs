var Story = require('../dist/ink.cjs.js').Story;
var fs = require('fs');
var readline = require('readline');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var inkFile = fs.readFileSync(__dirname + '/stories/var.ink.json', 'UTF-8');
var s = new Story(inkFile);
//var json = s.state.toJson();
//s.state.LoadJson(json);
//console.log(s.variablesState.$('mood'));
s.variablesState.$('mood', 1)

continueToNextChoice();

function continueToNextChoice(){
	if (!s.canContinue) end();
	
	while (s.canContinue){
		console.log(s.Continue());
	}
	
	if (s.currentChoices.length > 0){
		for (var i = 0; i < s.currentChoices.length; ++i) {
			var choice = s.currentChoices[i];
			console.log((i + 1) + ". " + choice.text);
		}
		
		rl.question('> ', (answer) => {
			s.ChooseChoiceIndex(parseInt(answer) - 1);
			continueToNextChoice();
		});
	}
	else{
		end();
	}
}

function end(){
	console.log('THE END');
	rl.close();
}