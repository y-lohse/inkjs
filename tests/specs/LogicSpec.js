var testsUtils = require('../common.js');

describe('Logic', function(){
  
  var story;
  beforeEach(function(){
    story = testsUtils.loadInkFile('tests.json');
  });
  
  it('should define variables', function(){
    story.ChoosePathString('logic.vardef');
    
    expect(story.Continue()).toEqual('variables defined: Emilia 521 52.1\n');
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
  
  it('should perform if/else tests', function(){
    story.ChoosePathString('logic.ifelse');
    expect(story.Continue()).toEqual('if text\n');
    expect(story.Continue()).toEqual('else text\n');
    expect(story.Continue()).toEqual('elseif text\n');
  });
  
  it('should support params for stitches', function(){
    story.ChoosePathString('logic.stitch_param');
    expect(story.Continue()).toEqual('Called with param\n');
  });
  
  it('should define constants', function(){
    story.ChoosePathString('logic.constants');
    expect(story.Continue()).toEqual('constants defined: Emilia 521 52.1\n');
  });
});