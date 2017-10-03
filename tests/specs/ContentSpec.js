var testsUtils = require('../common.js');

describe('Content', function(){
  
  var story;
  beforeEach(function(){
    story = testsUtils.loadInkFile('tests.json');
  });
  
  it('should read simple content', function(){
    story.ChoosePathString('content.simple');
    
    expect(story.Continue()).toEqual('Simple content inside a knot\n');
  });
  
  it('should read multiline content', function(){
    story.ChoosePathString('content.multiline');
    
    expect(story.Continue()).toEqual('First line\n');
    expect(story.canContinue).toBeTruthy();
    expect(story.Continue()).toEqual('Second line\n');
  });
  
  it('should print a variable', function(){
    story.ChoosePathString('content.variable_text');
    
    expect(story.Continue()).toEqual('variable text\n');
  });
  
  it('should print a truthy conditional text', function(){
    story.ChoosePathString('content.if_text_truthy');
    
    expect(story.Continue()).toEqual('I… I saw him. Only for a moment.\n');
  });
  
  it('should print a falsy conditional text', function(){
    story.ChoosePathString('content.if_text_falsy');
    
    expect(story.Continue()).toEqual('I… \n');
  });
  
  it('should print handle an if/else text', function(){
    story.ChoosePathString('content.if_else_text');
    
    expect(story.Continue()).toEqual('I saw him. Only for a moment.\n');
    expect(story.Continue()).toEqual('I missed him. Was he particularly evil?\n');
  });
  
});

describe('Glue', function(){
  
  var story;
  beforeEach(function(){
    story = testsUtils.loadInkFile('tests.json');
  });
  
  it('should glue lines together', function(){
    story.ChoosePathString('glue.simple');
    
    expect(story.Continue()).toEqual('Simple glue\n');
  });
  
  xit('should glue diverts together', function(){
    story.ChoosePathString('glue.diverted_glue');
    
    expect(story.Continue()).toEqual('More glue\n');
  });
  
});

describe('Divert', function(){
  
  var story;
  beforeEach(function(){
    story = testsUtils.loadInkFile('tests.json');
  });
  
  it('should divert to a knot', function(){
    story.ChoosePathString('divert.divert_knot');
    
    expect(story.Continue()).toEqual('Diverted to a knot\n');
  });
  
  it('should divert to a stitch', function(){
    story.ChoosePathString('divert.divert_stitch');
    
    expect(story.Continue()).toEqual('Diverted to a stitch\n');
  });
  
  it('should divert to an internal stitch', function(){
    story.ChoosePathString('divert.internal_stitch');
    
    expect(story.Continue()).toEqual('Diverted to internal stitch\n');
  });
  
  it ('should divert with a variable', function(){
    story.ChoosePathString('divert.divert_var');
    
    expect(story.Continue()).toEqual('Diverted with a variable\n');
  });
  
});