import * as testsUtils from "../common";

describe("Weaves", () => {
  let context: testsUtils.TestContext;

  function compileStory(
    name: string,
    countAllVisits: boolean = false,
    testingErrors: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "weaves",
      countAllVisits,
      testingErrors
    );
  }

  afterEach(() => {
    context = new testsUtils.TestContext();
  });

  // TestConditionalChoiceInWeave
  it("tests conditional choice in weave", () => {
    compileStory("conditional_choice_in_weave");

    expect(context.story.ContinueMaximally()).toBe(
      "start\ngather should be seen\n"
    );
    expect(context.story.currentChoices.length).toBe(1);
    expect(context.story.currentChoices[0].text).toBe("go to a stitch");

    context.story.ChooseChoiceIndex(0);

    expect(context.story.ContinueMaximally()).toBe("result\n");
  });

  // TestConditionalChoiceInWeave2
  it("tests conditional choice in weave 2", () => {
    compileStory("conditional_choice_in_weave_2");

    expect(context.story.Continue()).toBe("first gather\n");
    expect(context.story.currentChoices.length).toBe(2);

    context.story.ChooseChoiceIndex(0);

    expect(context.story.ContinueMaximally()).toBe(
      "the main gather\nbottom gather\n"
    );
    expect(context.story.currentChoices.length).toBe(0);
  });

  // TestUnbalancedWeaveIndentation
  it("tests unbalanced weave indentation", () => {
    compileStory("unbalanced_weave_indentation");

    context.story.ContinueMaximally();

    expect(context.story.currentChoices.length).toBe(1);
    expect(context.story.currentChoices[0].text).toBe("First");

    context.story.ChooseChoiceIndex(0);
    expect(context.story.ContinueMaximally()).toBe("First\n");
    expect(context.story.currentChoices.length).toBe(1);
    expect(context.story.currentChoices[0].text).toBe("Very indented");

    context.story.ChooseChoiceIndex(0);
    expect(context.story.ContinueMaximally()).toBe("Very indented\nEnd\n");
    expect(context.story.currentChoices.length).toBe(0);
  });

  // TestWeaveGathers
  it("tests weave gathers", () => {
    compileStory("weave_gathers");

    context.story.ContinueMaximally();

    expect(context.story.currentChoices.length).toBe(2);
    expect(context.story.currentChoices[0].text).toBe("one");
    expect(context.story.currentChoices[1].text).toBe("four");

    context.story.ChooseChoiceIndex(0);
    context.story.ContinueMaximally();

    expect(context.story.currentChoices.length).toBe(1);
    expect(context.story.currentChoices[0].text).toBe("two");

    context.story.ChooseChoiceIndex(0);
    expect(context.story.ContinueMaximally()).toBe("two\nthree\nsix\n");
  });

  // TestWeaveOptions
  it("tests weave options", () => {
    compileStory("weave_options");

    context.story.ContinueMaximally();
    expect(context.story.currentChoices[0].text).toBe("Hello.");

    context.story.ChooseChoiceIndex(0);
    expect(context.story.Continue()).toBe("Hello, world.\n");
  });

  // TestWeaveWithinSequence
  it("tests weave within sequence", () => {
    compileStory("weave_within_sequence");

    context.story.Continue();
    expect(context.story.currentChoices.length).toBe(1);

    context.story.ChooseChoiceIndex(0);
    expect(context.story.ContinueMaximally()).toBe("choice\nnextline\n");
  });

  // TestWeavePointNamingCollision
  it("tests weave point naming collision", () => {
    compileStory("weave_point_naming_collision", false, true);

    expect(context.errorMessages).toContainStringContaining(
      "with the same label"
    );
  });
});
