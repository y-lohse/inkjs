var Story = require('../dist/ink-es2015.js').Story;
var fs = require('fs');
var readline = require('readline');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var inkFile = fs.readFileSync(__dirname + '/stories/test.ink.json', 'UTF-8').replace(/^\uFEFF/, '');
var s = new Story(inkFile);

//console.log(s.BuildStringOfHierarchy());
console.log(s.EvaluateFunction('describe_health', [50]));

//end();
var gameSave;

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