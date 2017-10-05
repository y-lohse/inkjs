var testsUtils = require('../common.js');

describe('Integration', function(){
  
  var story;
  beforeEach(function(){
    story = testsUtils.loadInkFile('tests.json');
  });
  
  it('should load a file', function(){
    expect(story.canContinue).toBe(true);
  });
  
  it ('should jump to a knot', function() {
    story.ChoosePathString('knot');
    expect(story.canContinue).toBe(true);
    
    expect(story.Continue()).toEqual('Knot content\n');
  });
  
  it ('should jump to a stitch', function() {
    story.ChoosePathString('knot.stitch');
    expect(story.canContinue).toBe(true);
    
    expect(story.Continue()).toEqual('Stitch content\n');
  });
  
  it('should read variables from ink', function(){
    expect(story.variablesState['stringvar']).toEqual('Emilia');
    expect(story.variablesState['intvar']).toEqual(521);
    expect(story.variablesState['floatvar']).toEqual(52.1);
    expect(story.variablesState['divertvar'].toString()).toEqual('logic.logic_divert_dest');
  });
  
  it('should write variables to ink', function(){
    expect(story.variablesState['stringvar']).toEqual('Emilia');
    story.variablesState['stringvar'] = 'Jonas';
    expect(story.variablesState['stringvar']).toEqual('Jonas');
  });
  
  xit('should observe variables', function(){
    story.ChoosePathString('integration.variable_observer');
    expect(story.variablesState['observedVar1']).toEqual(1);
    expect(story.variablesState['observedVar2']).toEqual(2);
    
    expect(story.Continue()).toEqual('declared\n');
    
    const spy1 = jasmine.createSpy('variable observer spy 1');
    const spy2 = jasmine.createSpy('variable observer spy 2');
    const commonSpy = jasmine.createSpy('variable observer spy common');
    story.ObserveVariable('observedVar1', spy1);
    story.ObserveVariable('observedVar2', spy2);
    story.ObserveVariable('observedVar1', commonSpy);
    story.ObserveVariable('observedVar2', commonSpy);
    
    expect(story.variablesState['observedVar1']).toEqual(1);
    expect(story.variablesState['observedVar2']).toEqual(2);
    expect(spy1).toHaveBeenCalledTimes(0);
    expect(spy2).toHaveBeenCalledTimes(0);
    expect(commonSpy).toHaveBeenCalledTimes(0);
    
    expect(story.Continue()).toEqual('mutated 1\n');
    
    expect(story.variablesState['observedVar1']).toEqual(3);
    expect(story.variablesState['observedVar2']).toEqual(2);
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy1).toHaveBeenCalledWith('observedVar1', 3);
    expect(spy2).toHaveBeenCalledTimes(0);
    expect(commonSpy).toHaveBeenCalledTimes(1);
    expect(commonSpy).toHaveBeenCalledWith('observedVar1', 3);
    
    expect(story.Continue()).toEqual('mutated 2\n');
    
    expect(story.variablesState['observedVar1']).toEqual(4);
    expect(story.variablesState['observedVar2']).toEqual(5);
    
    expect(spy1).toHaveBeenCalledTimes(2);
    expect(spy1).toHaveBeenCalledWith('observedVar1', 4);
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy1).toHaveBeenCalledWith('observedVar2', 5);
  });
  
});