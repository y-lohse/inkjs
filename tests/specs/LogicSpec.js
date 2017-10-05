var testsUtils = require('../common.js');

describe('Logic', function(){
  
  var story;
  beforeEach(function(){
    story = testsUtils.loadInkFile('tests.json');
    story.allowExternalFunctionFallbacks = true;
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
  
  it('should call ink functions', function(){
    story.ChoosePathString('logic.simple_functions');
    
    expect(story.Continue()).toEqual('returned\n');
    expect(story.Continue()).toEqual('function called\n');
    expect(story.Continue()).toEqual('nested function called\n');
    expect(story.Continue()).toEqual('Function called inline and returned something\n');
  });
  
  it('should call ink functions', function(){
    story.ChoosePathString('logic.param_functions');
    
    expect(story.variablesState['fnParamA']).toEqual('a');
    expect(story.variablesState['fnParamB']).toEqual('b');
    
    expect(story.Continue()).toEqual('was a\n');
    expect(story.variablesState['fnParamA']).toEqual('a');
    expect(story.variablesState['fnParamB']).toEqual('b');
    
    expect(story.Continue()).toEqual('was a\n');
    expect(story.variablesState['fnParamA']).toEqual('was a');
    expect(story.variablesState['fnParamB']).toEqual('was b');
    
    expect(story.canContinue).toBe(false);
  });
  
  it('should call ink functions', function(){
    story.ChoosePathString('logic.void_function');
    story.Continue()
    
    expect(story.canContinue).toBe(false);
  });
});