var testsUtils = require('../common.js');

describe('Tags', function(){
  
  var story;
  beforeEach(function(){
    story = testsUtils.loadInkFile('tests.json');
  });
  
  it('should find global tags', function(){
    var tags = story.globalTags;
    console.log(tags)
    
    expect(tags.length).toBe(1);
    expect(tags[0]).toEqual('global tag');
  });
  
  it('should find knot level tags', function(){
    var tags = story.TagsForContentAtPath('tags');
    
    expect(tags.length).toBe(1);
    expect(tags[0]).toEqual('knot tag');
  });
  
  it('should find line by line tags', function(){
    story.ChoosePathString('tags.line_by_Line');
    story.Continue();
    
    var tags = story.currentTags;
    
    expect(tags.length).toBe(1);
    expect(tags[0]).toEqual('a tag');
    
    story.Continue();
    tags = story.currentTags;
    
    expect(tags.length).toBe(2);
    expect(tags[0]).toEqual('tag1');
    expect(tags[1]).toEqual('tag2');
    
    story.Continue();
    tags = story.currentTags;
    
    expect(tags.length).toBe(2);
    expect(tags[0]).toEqual('tag above');
    expect(tags[1]).toEqual('tag after');
  });
  
  it('should handle tag edge cases', function(){
    story.ChoosePathString('tags.weird');
    story.Continue();
    
    var tags = story.currentTags;
    
    expect(tags.length).toBe(5);
    expect(tags[0]).toEqual('space around');
    expect(tags[1]).toEqual('');
    expect(tags[2]).toEqual('');
    expect(tags[3]).toEqual('');
    expect(tags[4]).toEqual('0');
  });
  
});