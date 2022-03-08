import * as testsUtils from "../../common";

describe("Choices", () => {
  let context: testsUtils.TestContext;

  beforeEach(() => {
    context = testsUtils.makeDefaultTestContext("tests", "inkjs", true);
    context.story.allowExternalFunctionFallbacks = true;
  });

  it("should offer a single choice", () => {
    context.story.ChoosePathString("choices.basic_choice");

    context.story.Continue();
    expect(context.story.currentChoices.length).toEqual(1);
    expect(context.story.canContinue).toBe(false);
  });

  it("should offer multiple choices", () => {
    context.story.ChoosePathString("choices.multiple_choices");

    context.story.Continue();
    expect(context.story.currentChoices.length).toEqual(3);
    expect(context.story.canContinue).toBe(false);
  });

  it("should select a choice", () => {
    context.story.ChoosePathString("choices.multiple_choices");

    context.story.Continue();
    context.story.ChooseChoiceIndex(0);
    expect(context.story.Continue()).toEqual("choice 1\n");
    expect(context.story.canContinue).toBe(false);
  });

  it("should throw when selecting an invalid choice", () => {
    context.story.ChoosePathString("choices.multiple_choices");

    context.story.Continue();
    expect(() => context.story.ChooseChoiceIndex(10)).toThrow();
  });

  it("should suppress parts of choice text", () => {
    context.story.ChoosePathString("choices.choice_text");

    context.story.Continue();
    expect(context.story.currentChoices.length).toEqual(1);
    expect(context.story.canContinue).toBe(false);

    expect(context.story.currentChoices[0].text).toEqual("always choice only");
    context.story.ChooseChoiceIndex(0);
    expect(context.story.canContinue).toBe(true);
    expect(context.story.Continue()).toEqual("always output only\n");
    expect(context.story.canContinue).toBe(false);
  });

  it("should suppress choices after they have been selected", () => {
    context.story.ChoosePathString("choices.suppression");
    expect(context.story.canContinue).toBe(true);
    context.story.Continue();

    expect(context.story.currentChoices.length).toEqual(2);
    expect(context.story.currentChoices[0].text).toEqual("choice 1");
    expect(context.story.currentChoices[1].text).toEqual("choice 2");

    context.story.ChooseChoiceIndex(1);
    expect(context.story.Continue()).toEqual("choice 2\n");
    expect(context.story.canContinue).toBe(false);

    context.story.ChoosePathString("choices.suppression");
    expect(context.story.canContinue).toBe(true);
    context.story.Continue();

    expect(context.story.currentChoices.length).toEqual(1);
    expect(context.story.currentChoices[0].text).toEqual("choice 1");

    context.story.ChooseChoiceIndex(0);
    expect(context.story.Continue()).toEqual("choice 1\n");
    expect(context.story.canContinue).toBe(false);

    context.story.ChoosePathString("choices.suppression");
    expect(context.story.canContinue).toBe(true);
    // TODO test for exception
  });

  it("should select the fallback choice", () => {
    context.story.ChoosePathString("choices.fallback");
    expect(context.story.canContinue).toBe(true);
    context.story.Continue();

    expect(context.story.currentChoices.length).toEqual(1);
    expect(context.story.currentChoices[0].text).toEqual("choice 1");
    context.story.ChooseChoiceIndex(0);
    context.story.Continue();

    context.story.ChoosePathString("choices.fallback");
    expect(context.story.canContinue).toBe(true);
    context.story.Continue();

    expect(context.story.currentChoices.length).toEqual(0);
    expect(context.story.canContinue).toBe(false);
  });

  it("should keep a sticky choice", () => {
    context.story.ChoosePathString("choices.sticky");
    expect(context.story.canContinue).toBe(true);
    context.story.Continue();

    expect(context.story.currentChoices.length).toEqual(2);
    expect(context.story.currentChoices[0].text).toEqual("disapears");
    expect(context.story.currentChoices[1].text).toEqual("stays");

    context.story.ChooseChoiceIndex(0);
    context.story.Continue();

    for (let i = 0; i < 3; ++i) {
      context.story.ChoosePathString("choices.sticky");
      expect(context.story.canContinue).toBe(true);
      context.story.Continue();

      expect(context.story.currentChoices.length).toEqual(1);
      expect(context.story.currentChoices[0].text).toEqual("stays");
      context.story.ChooseChoiceIndex(0);
      expect(context.story.Continue()).toEqual("stays\n");
    }
  });

  it("should handle conditional choices", () => {
    context.story.ChoosePathString("choices.conditional");
    expect(context.story.canContinue).toBe(true);
    context.story.Continue();

    expect(context.story.currentChoices.length).toEqual(3);
    expect(context.story.currentChoices[0].text).toEqual("no condition");
    expect(context.story.currentChoices[1].text).toEqual("available");
    expect(context.story.currentChoices[2].text).toEqual(
      "multi condition available"
    );
  });
});
