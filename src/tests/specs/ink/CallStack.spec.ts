import * as testsUtils from "../common";

describe("Callstack", () => {
  let context: testsUtils.TestContext;

  function compileStory(
    name: string,
    countAllVisits: boolean = false,
    testingErrors: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "callstack",
      countAllVisits,
      testingErrors
    );
  }

  afterEach(() => {
    context = new testsUtils.TestContext();
  });

  // TestCallStackEvaluation
  it("tests call stack evaluation", () => {
    compileStory("callstack_evaluation");
    expect(context.story.Continue()).toBe("8\n");
  });

  // TestCleanCallstackResetOnPathChoice
  it("tests clean callstack reset on path choice", () => {
    compileStory("clean_callstack_reset_on_path_choice");

    expect(context.story.Continue()).toBe("The first line.\n");

    context.story.ChoosePathString("SomewhereElse");

    expect(context.story.ContinueMaximally()).toBe("somewhere else\n");
  });
});
