var testsUtils = require('./common.js');

describe('Content', function(){
	
	it('should print a simple line', function(){
		var story = testsUtils.loadInkFile('content/single-line.ink.json');
		
		expect(story.canContinue).toBe(true);
		expect(story.Continue()).toEqual('Hello, world!\n');
		expect(story.canContinue).toBe(false);
		
		expect(story.currentChoices.length).toBe(0);
	});
	
	it('should print multiple lines', function(){
		var story = testsUtils.loadInkFile('content/multi-line.ink.json');
		
		expect(story.canContinue).toBe(true);
		expect(story.Continue()).toEqual('Hello, world!\n');
		expect(story.canContinue).toBe(true);
		expect(story.Continue()).toEqual('Hello?\n');
		expect(story.canContinue).toBe(true);
		expect(story.Continue()).toEqual('Hello, are you there?\n');
		expect(story.canContinue).toBe(false);
		
		expect(story.currentChoices.length).toBe(0);
	});
	
});