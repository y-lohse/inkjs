var testsUtils = require('../common.js');

describe('Choices', function(){

  var story;
  beforeEach(function(){
    story = testsUtils.loadInkFile('tests.json');
    story.allowExternalFunctionFallbacks = true;
  });

  it('should offer a single choice', function(){
    story.ChoosePathString('choices.basic_choice');

    story.Continue();
    expect(story.currentChoices.length).toEqual(1);
    expect(story.canContinue).toBe(false);
  });

  it('should offer multiple choices', function(){
    story.ChoosePathString('choices.multiple_choices');

    story.Continue();
    expect(story.currentChoices.length).toEqual(3);
    expect(story.canContinue).toBe(false);
  });

  it('should select a choice', function(){
    story.ChoosePathString('choices.multiple_choices');

    story.Continue();
    story.ChooseChoiceIndex(0);
    expect(story.Continue()).toEqual('choice 1\n');
    expect(story.canContinue).toBe(false);
  });

  it('should throw when selecting an invalid choice', function(){
    story.ChoosePathString('choices.multiple_choices');

    story.Continue();
    expect(() => story.ChooseChoiceIndex(10)).toThrow();
  });

  it('should suppress parts of choice text', function(){
    story.ChoosePathString('choices.choice_text');

    story.Continue();
    expect(story.currentChoices.length).toEqual(1);
    expect(story.canContinue).toBe(false);

    expect(story.currentChoices[0].text).toEqual('always choice only');
    story.ChooseChoiceIndex(0);
    expect(story.canContinue).toBe(true);
    expect(story.Continue()).toEqual('always output only\n');
    expect(story.canContinue).toBe(false);
  });

  it('should suppress choices after they have been selected', function(){
    story.ChoosePathString('choices.suppression');
    expect(story.canContinue).toBe(true);
    story.Continue();

    expect(story.currentChoices.length).toEqual(2);
    expect(story.currentChoices[0].text).toEqual('choice 1');
    expect(story.currentChoices[1].text).toEqual('choice 2');

    story.ChooseChoiceIndex(1);
    expect(story.Continue()).toEqual('choice 2\n');
    expect(story.canContinue).toBe(false);

    story.ChoosePathString('choices.suppression');
    expect(story.canContinue).toBe(true);
    story.Continue();

    expect(story.currentChoices.length).toEqual(1);
    expect(story.currentChoices[0].text).toEqual('choice 1');

    story.ChooseChoiceIndex(0);
    expect(story.Continue()).toEqual('choice 1\n');
    expect(story.canContinue).toBe(false);

    story.ChoosePathString('choices.suppression');
    expect(story.canContinue).toBe(true);
    // TODO test for exception
  });

  it('should select the fallback choice', function(){
    story.ChoosePathString('choices.fallback');
    expect(story.canContinue).toBe(true);
    story.Continue();

    expect(story.currentChoices.length).toEqual(1);
    expect(story.currentChoices[0].text).toEqual('choice 1');
    story.ChooseChoiceIndex(0);
    story.Continue();

    story.ChoosePathString('choices.fallback');
    expect(story.canContinue).toBe(true);
    story.Continue();

    expect(story.currentChoices.length).toEqual(0);
    expect(story.canContinue).toBe(false);
  });

  it('should keep a sticky choice', function(){
    story.ChoosePathString('choices.sticky');
    expect(story.canContinue).toBe(true);
    story.Continue();

    expect(story.currentChoices.length).toEqual(2);
    expect(story.currentChoices[0].text).toEqual('disapears');
    expect(story.currentChoices[1].text).toEqual('stays');

    story.ChooseChoiceIndex(0);
    story.Continue();

    for (let i = 0; i < 3; ++i) {
      story.ChoosePathString('choices.sticky');
      expect(story.canContinue).toBe(true);
      story.Continue();

      expect(story.currentChoices.length).toEqual(1);
      expect(story.currentChoices[0].text).toEqual('stays');
      story.ChooseChoiceIndex(0);
      expect(story.Continue()).toEqual('stays\n');
    }
  });

  it('should handle conditional choices', function(){
    story.ChoosePathString('choices.conditional');
    expect(story.canContinue).toBe(true);
    story.Continue();

    expect(story.currentChoices.length).toEqual(3);
    expect(story.currentChoices[0].text).toEqual('no condition');
    expect(story.currentChoices[1].text).toEqual('available');
    expect(story.currentChoices[2].text).toEqual('multi condition available');
  });

});
