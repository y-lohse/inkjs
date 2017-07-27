var testsUtils = require('../common.js');

describe('Content', function(){
  
  it('should load a file', function(){
    var story = testsUtils.loadInkFile('tests.json');
    
    expect(story.canContinue).toBe(true);
  });
  
});