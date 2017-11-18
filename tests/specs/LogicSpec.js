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
  
  it('should cast variables', function(){
    story.ChoosePathString('logic.casts');
    expect(story.Continue()).toEqual('521.5\n');
    expect(story.Continue()).toEqual('521hello\n');
    expect(story.Continue()).toEqual('float var is truthy\n');
    expect(story.Continue()).toEqual('52.1hello\n');
    expect(story.Continue()).toEqual('string var is truthy\n');
  });
  
  it('should perform mathematical operations', function(){
    story.ChoosePathString('logic.math');
    
    expect(story.Continue()).toEqual('2\n');
    expect(story.Continue()).toEqual('0\n');
    expect(story.Continue()).toEqual('-5\n');
    expect(story.Continue()).toEqual('2\n');
    expect(story.Continue()).toEqual('5\n');
    expect(story.Continue()).toEqual('1\n');
    
    expect(story.Continue()).toEqual('int truthy equal\n');
    expect(story.Continue()).toEqual('int falsy equal\n');
    
    expect(story.Continue()).toEqual('int truthy greater\n');
    expect(story.Continue()).toEqual('int falsy greater\n');
    
    expect(story.Continue()).toEqual('int truthy lesser\n');
    expect(story.Continue()).toEqual('int falsy lesser\n');
    
    expect(story.Continue()).toEqual('int truthy greater or equal\n');
    expect(story.Continue()).toEqual('int falsy greater or equal\n');
    
    expect(story.Continue()).toEqual('int truthy lesser or equal\n');
    expect(story.Continue()).toEqual('int falsy lesser or equal\n');
    
    expect(story.Continue()).toEqual('int truthy not equal\n');
    expect(story.Continue()).toEqual('int falsy not equal\n');
    
    expect(story.Continue()).toEqual('int truthy not\n');
    expect(story.Continue()).toEqual('int falsy not\n');
    
    expect(story.Continue()).toEqual('int truthy and\n');
    expect(story.Continue()).toEqual('int falsy and\n');
    
    expect(story.Continue()).toEqual('int truthy or\n');
    expect(story.Continue()).toEqual('int falsy or\n');
    
    
    expect(parseFloat(story.Continue())).toBeCloseTo(2.6);
    expect(parseFloat(story.Continue())).toBeCloseTo(0);
    expect(parseFloat(story.Continue())).toBeCloseTo(-5.2);
    expect(parseFloat(story.Continue())).toBeCloseTo(3.6);
    expect(parseFloat(story.Continue())).toBeCloseTo(4.2);
    expect(parseFloat(story.Continue())).toBeCloseTo(1.5);
    
    expect(story.Continue()).toEqual('float truthy equal\n');
    expect(story.Continue()).toEqual('float falsy equal\n');
    
    expect(story.Continue()).toEqual('float truthy greater\n');
    expect(story.Continue()).toEqual('float falsy greater\n');
    
    expect(story.Continue()).toEqual('float truthy lesser\n');
    expect(story.Continue()).toEqual('float falsy lesser\n');
    
    expect(story.Continue()).toEqual('float truthy greater or equal\n');
    expect(story.Continue()).toEqual('float falsy greater or equal\n');
    
    expect(story.Continue()).toEqual('float truthy lesser or equal\n');
    expect(story.Continue()).toEqual('float falsy lesser or equal\n');
    
    expect(story.Continue()).toEqual('float truthy not equal\n');
    expect(story.Continue()).toEqual('float falsy not equal\n');
    
    expect(story.Continue()).toEqual('float falsy not\n');
    
    expect(story.Continue()).toEqual('float truthy and\n');
    expect(story.Continue()).toEqual('float falsy and\n');
    
    expect(story.Continue()).toEqual('float truthy or\n');
    expect(story.Continue()).toEqual('float falsy or\n');
    
    expect(story.Continue()).toEqual('truthy string equal\n');
    expect(story.Continue()).toEqual('falsy string equal\n');
    expect(story.Continue()).toEqual('truthy string not equal\n');
    expect(story.Continue()).toEqual('falsy string not equal\n');
    expect(story.Continue()).toEqual('truthy divert equal\n');
    expect(story.Continue()).toEqual('falsy divert equal\n');
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
  
  it('should generate random numbers', function(){
    story.ChoosePathString('logic.random');
    
    expect(story.Continue()).toEqual('15\n');
    expect(story.Continue()).toEqual('-24\n');
  });
});