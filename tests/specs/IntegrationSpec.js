var testsUtils = require('../common.js');

describe('Integration', function(){
  
  var story;
  beforeEach(function(){
    story = testsUtils.loadInkFile('tests.json');
    story.allowExternalFunctionFallbacks = true;
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
  
  it('should increment the read count on each visit', function(){
    expect(story.state.VisitCountAtPathString('integration.visit_count')).toEqual(0);
    
    for (let i = 0; i < 10; ++i){
      story.ChoosePathString('integration.visit_count');
      expect(story.Continue()).toEqual('visited\n');
      expect(story.canContinue).toEqual(false);
      expect(story.state.VisitCountAtPathString('integration.visit_count')).toEqual(i + 1);
      story.ChoosePathString('integration.variable_observer');
      story.Continue();
    }
  });
  
  it('should not increment the read count as long as the knot is not left', function(){
    expect(story.state.VisitCountAtPathString('integration.visit_count')).toEqual(0);
    
    for (let i = 0; i < 10; ++i){
      story.ChoosePathString('integration.visit_count');
      expect(story.Continue()).toEqual('visited\n');
      expect(story.state.VisitCountAtPathString('integration.visit_count')).toEqual(1);
      // here we don't leave the knot, so we never enter it again
    }
  });
  
  it('should call ink functions', function(){
    expect(story.EvaluateFunction('fn_with_return')).toEqual('returned');
    expect(story.EvaluateFunction('fn_without_return')).toBeNull();
    expect(story.EvaluateFunction('fn_print')).toBeNull();
    expect(story.EvaluateFunction('fn_calls_other')).toEqual('nested function called');
  });
  
  it('should call ink functions with params', function(){
    expect(story.EvaluateFunction('fn_params', ['a', 'b'])).toEqual('was a');
    expect(story.EvaluateFunction('fn_echo', ['string'])).toEqual('string');
    expect(story.EvaluateFunction('fn_echo', [5])).toEqual(5);
    expect(story.EvaluateFunction('fn_echo', [5.3])).toEqual(5.3);
  });
  
  it('should return output and return value from ink function calls', function(){
    expect(story.EvaluateFunction('fn_print', [], true)).toEqual({
      returned: null,
      output: 'function called\n'
    });
    expect(story.EvaluateFunction('fn_echo', ['string'], true)).toEqual({
      returned: 'string',
      output: 'string\n'
    });
    expect(story.EvaluateFunction('fn_echo', [5], true)).toEqual({
      returned: 5,
      output: '5\n'
    });
    expect(story.EvaluateFunction('fn_echo', [5.3], true)).toEqual({
      returned: 5.3,
      output: '5.3\n'
    });
  });
  
  xit('should call external functions', function(){
    story.allowExternalFunctionFallbacks = false;
    story.ChoosePathString('integration.external');
    const externalSpy = jasmine.createSpy('external function spy', function(a, b, c){
      return a;
    }).and.callThrough();
    story.BindExternalFunction('fn_ext', externalSpy);
    
    expect(story.Continue()).toEqual('1\n');
    expect(externalSpy).toHaveBeenCalledTimes(1);
    expect(externalSpy).toHaveBeenCalledWith(1, 2, 3);
    
//    expect(externalSpy).toHaveBeenCalledWith(1.1, 2.2, 3.3);
//    expect(externalSpy).toHaveBeenCalledWith('a', 'b', 'c');
//    expect(externalSpy).toHaveBeenCalledWith('a', 1, 2.2);
  });
  
});