var Story = require('../dist/ink.cjs.js').Story;
var fs = require('fs');
var readline = require('readline');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var inkFile = fs.readFileSync(__dirname + '/stories/external.ink.json', 'UTF-8');
var s = new Story(inkFile);
var gameSave;

s.BindExternalFunction('simple', function(){
	return '15';
});

s.BindExternalFunction('multiply', function(x, y){
	return x * y;
});

continueToNextChoice();

function continueToNextChoice(){
	if (!s.canContinue && s.currentChoices.length === 0) end();
	
	while (s.canContinue){
		console.log(s.Continue());
	}
	
	if (s.currentChoices.length > 0){
		for (var i = 0; i < s.currentChoices.length; ++i) {
			var choice = s.currentChoices[i];
			console.log((i + 1) + ". " + choice.text);
		}
		
		rl.question('> ', (answer) => {
			if (answer == 'save'){
				gameSave = s.state.toJson();
				console.log('game saved');
			}
			else if (answer == 'load'){
				s.state.LoadJson(gameSave);
				console.log('game restored');
			}
			else{
				s.ChooseChoiceIndex(parseInt(answer) - 1);
			}
			
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