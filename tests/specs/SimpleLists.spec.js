var testsUtils = require('../common.js');

describe('Simple lists', function(){
  
  var story;
  beforeEach(function(){
    story = testsUtils.loadInkFile('tests.json');
    story.allowExternalFunctionFallbacks = true;
  });
  
  it('should go through a sequence', function(){
    story.ChoosePathString('simple_lists.sequence');
    expect(story.Continue()).toEqual('one\n');
    
    story.ChoosePathString('simple_lists.sequence');
    expect(story.Continue()).toEqual('two\n');
    
    story.ChoosePathString('simple_lists.sequence');
    expect(story.Continue()).toEqual('three\n');
    
    story.ChoosePathString('simple_lists.sequence');
    expect(story.Continue()).toEqual('final\n');
    
    story.ChoosePathString('simple_lists.sequence');
    expect(story.Continue()).toEqual('final\n');
  });
  
  it('should go through a cycle', function(){
    var results = ['one\n', 'two\n', 'three\n'];
    
    for (var i = 0; i < 10; ++i){
      story.ChoosePathString('simple_lists.cycle');
      expect(story.Continue()).toEqual(results[i%3]);
    }
  });
  
  it('should go through a list once', function(){
    story.ChoosePathString('simple_lists.once');
    expect(story.Continue()).toEqual('one\n');
    
    story.ChoosePathString('simple_lists.once');
    expect(story.Continue()).toEqual('two\n');
    
    story.ChoosePathString('simple_lists.once');
    expect(story.Continue()).toEqual('three\n');
    
    story.ChoosePathString('simple_lists.once');
    expect(story.Continue()).toEqual('');
  });
  
  it('should go through a shuffle', function(){
    var results = ['heads\n', 'tails\n'];
    
    for (var i = 0; i < 40; ++i){
      story.ChoosePathString('simple_lists.shuffle');
      expect(results).toContain(story.Continue());
    }
  });
  
  it('should handle blank elements', function(){
    for (var i = 0; i < 3; ++i){
      story.ChoosePathString('simple_lists.blanks');
      expect(story.Continue()).toEqual('');
    }
    
    story.ChoosePathString('simple_lists.blanks');
    expect(story.Continue()).toEqual('end\n');
  });
  
});