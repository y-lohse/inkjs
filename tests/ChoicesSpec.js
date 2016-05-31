var testsUtils = require('./common.js');

describe('Choices', function(){

	it('should read content before choices', function(){
		var story = testsUtils.loadInkFile('choices/one.ink.json');
		
		expect(story.canContinue).toBe(true);
		expect(story.Continue()).toEqual('Hello world!\n');
		expect(story.canContinue).toBe(false);
	});
	
	it('should have a single choice', function(){
		var story = testsUtils.loadInkFile('choices/one.ink.json');
		
		story.Continue();
		
		expect(story.currentChoices.length).toBe(1);
		expect(story.currentChoices[0].text).toBe('Hello back!');
	});
	
	it('should make a choice', function(){
		var story = testsUtils.loadInkFile('choices/one.ink.json');
		
		story.Continue();
		story.ChooseChoiceIndex(0);
		
		expect(story.currentChoices.length).toBe(0);
		expect(story.canContinue).toBe(true);
	});
	
});