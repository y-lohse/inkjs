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

  it ('should get where the story currently is', function() {
    story.ChoosePathString('knot');
    expect(story.state.currentPathString).toBe('knot.0');
    expect(story.canContinue).toBe(true);
    story.Continue();
    expect(story.state.currentPathString).toBe(null);
    expect(story.canContinue).toBe(false);
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

  it('should observe variables', function(){
    story.ChoosePathString('integration.variable_observer');
    expect(story.variablesState['observedVar1']).toEqual(1);
    expect(story.variablesState['observedVar2']).toEqual(2);

    const spy1 = jasmine.createSpy('variable observer spy 1');
    const spy2 = jasmine.createSpy('variable observer spy 2');
    const commonSpy = jasmine.createSpy('variable observer spy common');
    story.ObserveVariable('observedVar1', spy1);
    story.ObserveVariable('observedVar2', spy2);
    story.ObserveVariable('observedVar1', commonSpy);
    story.ObserveVariable('observedVar2', commonSpy);

    expect(story.Continue()).toEqual('declared\n');

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
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledWith('observedVar2', 5);
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

  it('should increment the read count when the callstack is reset', function(){
    expect(story.state.VisitCountAtPathString('integration.visit_count')).toEqual(0);

    for (let i = 0; i < 10; ++i){
      story.ChoosePathString('integration.visit_count');
      expect(story.Continue()).toEqual('visited\n');
      expect(story.state.VisitCountAtPathString('integration.visit_count')).toEqual(i + 1);
    }
  });

  it('should not increment the read count when the callstack is not reset', function(){
    expect(story.state.VisitCountAtPathString('integration.visit_count')).toEqual(0);

    for (let i = 0; i < 10; ++i){
      story.ChoosePathString('integration.visit_count', false);
      expect(story.Continue()).toEqual('visited\n');
      expect(story.state.VisitCountAtPathString('integration.visit_count')).toEqual(1);
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

  it('should call external functions', function(){
    story.allowExternalFunctionFallbacks = false;
    story.ChoosePathString('integration.external');
    const externalSpy = jasmine.createSpy('external function spy', function(a, b, c){
      return a;
    }).and.callThrough();
    story.BindExternalFunction('fn_ext', externalSpy);
    story.BindExternalFunction('gameInc', ()=>{});

    expect(story.ContinueMaximally()).toEqual('1\n1.1\na\na\n');
    expect(externalSpy).toHaveBeenCalledWith(1, 2, 3);
    expect(externalSpy).toHaveBeenCalledWith(1.1, 2.2, 3.3);
    expect(externalSpy).toHaveBeenCalledWith('a', 'b', 'c');
    expect(externalSpy).toHaveBeenCalledWith('a', 1, 2.2);
  });

  it('should handle callstack changes', function(){
    story.allowExternalFunctionFallbacks = false;
    const externalSpy = jasmine.createSpy('external function spy', function(x){
      x++;
      x = parseInt(story.EvaluateFunction('inkInc', [x]));
      return x;
    }).and.callThrough();
    story.BindExternalFunction('fn_ext', () => {});
    story.BindExternalFunction('gameInc', externalSpy);

    const result = story.EvaluateFunction('topExternal', [5], true);

    expect(parseInt(result.returned)).toEqual(7);
    expect(result.output).toEqual('In top external\n');
  });


  it('should return a visit count', function(){
    expect(story.state.VisitCountAtPathString('game_queries.turnssince')).toEqual(0);

    story.ChoosePathString('game_queries.turnssince');
    story.Continue();
    expect(story.state.VisitCountAtPathString('game_queries.turnssince')).toEqual(1);

    story.ChoosePathString('game_queries.turnssince_1');
    story.Continue();
    story.ChoosePathString('game_queries.turnssince');
    story.Continue();
    expect(story.state.VisitCountAtPathString('game_queries.turnssince')).toEqual(2);
  });

  describe('Saving and Loading', function(){

    it('should continue the story', function(){
      story.ChoosePathString('saveload');
      expect(story.Continue()).toEqual('a bit of content\n');
      const save = story.state.ToJson();
      story.state.LoadJson(save);
      expect(story.Continue()).toEqual('the next bit\n');
    });

    it('should restore a choice point', function(){
      story.ChoosePathString('saveload.choicepoint');
      story.Continue();
      expect(story.currentChoices.length).toEqual(2);
      expect(story.currentChoices[0].text).toEqual('choice 1');
      expect(story.currentChoices[1].text).toEqual('choice 2');

      const save = story.state.ToJson();
      story.state.LoadJson(save);

      expect(story.currentChoices.length).toEqual(2);
      expect(story.currentChoices[0].text).toEqual('choice 1');
      expect(story.currentChoices[1].text).toEqual('choice 2');
    });

  });

  describe('debug tools', function(){

    it('should return a string of hierarchy', function(){
      expect(story.BuildStringOfHierarchy()).toBeDefined();
    });

  });

  describe('Exported classes', function(){
    it('should expose the Story class', function(){
      expect(testsUtils.inkjs.Story).toBeDefined();
    });

    it('should expose the InkList class', function(){
      expect(testsUtils.inkjs.InkList).toBeDefined();
    });
  })

});
