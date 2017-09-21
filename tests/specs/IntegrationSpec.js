var testsUtils = require('../common.js');

describe('Integration', function(){
  
  it('should load a file', function(){
    var story = testsUtils.loadInkFile('tests.json');
    
    expect(story.canContinue).toBeTruthy();
  });
  
  it ('should jump to a knot', function() {
    var story = testsUtils.loadInkFile('tests.json');
    
    story.ChoosePathString('knot');
    expect(story.canContinue).toBeTruthy();
    
    expect(story.Continue()).toEqual('Knot content\n');
  });
  
  it ('should jump to a stitch', function() {
    var story = testsUtils.loadInkFile('tests.json');
    
    story.ChoosePathString('knot.stitch');
    expect(story.canContinue).toBeTruthy();
    
    expect(story.Continue()).toEqual('Stitch content\n');
  });
  
});