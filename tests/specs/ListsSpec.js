var testsUtils = require('../common.js');

describe('Lists', function(){
  
  var story;
  beforeEach(function(){
    story = testsUtils.loadInkFile('tests.json');
    story.allowExternalFunctionFallbacks = true;
  });
  
  it('should be defined', function(){
    story.ChoosePathString('lists.basic_list');
    
    expect(story.Continue()).toEqual('cold\n');
    expect(story.Continue()).toEqual('boiling\n');
  });
  
  it('sould increment/decrement', function(){
    story.ChoosePathString('lists.increment');
    
    expect(story.Continue()).toEqual('cold\n');
    expect(story.Continue()).toEqual('boiling\n');
    expect(story.Continue()).toEqual('evaporated\n');
    expect(story.Continue()).toEqual('boiling\n');
    expect(story.Continue()).toEqual('cold\n');
  });
  
  it('should print the values', function(){
    story.ChoosePathString('lists.list_value');
    
    expect(story.Continue()).toEqual('1\n');
    expect(story.Continue()).toEqual('2\n');
    expect(story.Continue()).toEqual('3\n');
  });
  
  xit('should set names from values', function(){
    story.ChoosePathString('lists.value_from_number');
    
    expect(story.Continue()).toEqual('cold\n');
    expect(story.Continue()).toEqual('boiling\n');
    expect(story.Continue()).toEqual('evaporated\n'); 
  });
  
  xit('shuld handle user defined values', function(){
    story.ChoosePathString('lists.defined_value');
    expect(story.Continue()).toEqual('2\n');
    expect(story.Continue()).toEqual('3\n');
    expect(story.Continue()).toEqual('5\n');
  });

});