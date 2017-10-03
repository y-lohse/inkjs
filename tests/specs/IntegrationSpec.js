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
  
});