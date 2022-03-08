import * as testsUtils from "../common";

describe("Knots", () => {
  let context: testsUtils.TestContext;

  function compileStory(
    name: string,
    countAllVisits: boolean = false,
    testingErrors: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "knots",
      countAllVisits,
      testingErrors
    );
  }

  function compileStoryWithoutRuntime(
    name: string,
    countAllVisits: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "knots/compiler",
      countAllVisits,
      true
    );
  }

  afterEach(() => {
    context = new testsUtils.TestContext();
  });

  // TestKnotDotGather
  it("tests knot do not gather", () => {
    compileStory("knot_do_not_gather");

    expect(context.story.Continue()).toBe("g\n");
  });

  // TestKnotStitchGatherCounts
  it("tests knot stitch gather counts", () => {
    compileStory("knot_stitch_gather_counts");

    expect(context.story.ContinueMaximally()).toBe(
      "1 1\n2 2\n3 3\n1 1\n2 1\n3 1\n1 2\n2 2\n3 2\n1 1\n2 1\n3 1\n1 2\n2 2\n3 2\n"
    );
  });

  // TestKnotThreadInteraction
  it("tests knot thread interaction", () => {
    compileStory("knot_thread_interaction");

    expect(context.story.ContinueMaximally()).toBe("blah blah\n");

    expect(context.story.currentChoices.length).toBe(2);
    expect(context.story.currentChoices[0].text).toMatch("option");
    expect(context.story.currentChoices[1].text).toMatch("wigwag");

    context.story.ChooseChoiceIndex(1);

    expect(context.story.Continue()).toBe("wigwag\n");
    expect(context.story.Continue()).toBe("THE END\n");
  });

  // TestKnotThreadInteraction2
  it("tests knot thread interaction2", () => {
    compileStory("knot_thread_interaction_2");

    expect(context.story.ContinueMaximally()).toBe(
      "I’m in a tunnel\nWhen should this get printed?\n"
    );

    expect(context.story.currentChoices.length).toBe(1);
    expect(context.story.currentChoices[0].text).toBe("I’m an option");

    context.story.ChooseChoiceIndex(0);

    expect(context.story.ContinueMaximally()).toBe(
      "I’m an option\nFinishing thread.\n"
    );
  });

  // TestKnotTerminationSkipsGlobalObjects
  it("tests knot termination skips global objects", () => {
    compileStoryWithoutRuntime("knot_termination_skips_global_objects");

    expect(context.warningMessages.length).toBe(0);
  });

  // TestStitchNamingCollision
  it("tests stitch naming collision", () => {
    compileStory("stitch_naming_collision", false, true);

    expect(context.errorMessages).toContainStringContaining(
      "already been used for a var"
    );
  });
});
