var testsUtils = require('../common.js');

describe('Logic', function(){
  
  var story;
  beforeEach(function(){
    story = testsUtils.loadInkFile('tests.json');
  });
  
  it('should define variables', function(){
    story.ChoosePathString('logic.vardef');
    
    expect(story.Continue()).toEqual('variables defined\n');
  });
  
  it('should perform mathematical operations', function(){
    story.ChoosePathString('logic.math');
    
    expect(story.Continue()).toEqual('2\n');
    expect(story.Continue()).toEqual('0\n');
    expect(story.Continue()).toEqual('2\n');
    expect(story.Continue()).toEqual('5\n');
    expect(story.Continue()).toEqual('1\n');
    expect(story.Continue()).toEqual('4.6\n');
  });
});