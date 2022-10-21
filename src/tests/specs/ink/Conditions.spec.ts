import * as testsUtils from "../common";

describe("Conditions", () => {
  let context: testsUtils.TestContext;

  function compileStory(
    name: string,
    countAllVisits: boolean = false,
    testingErrors: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "conditions",
      countAllVisits,
      testingErrors
    );
  }

  afterEach(() => {
    context = new testsUtils.TestContext();
  });

  // TestAllSwitchBranchesFailIsClean
  it("tests all switch branches fail is clean", () => {
    compileStory("all_switch_branches_fail_is_clean");

    context.story.Continue();
    expect(context.story.state.evaluationStack.length).toBe(0);
  });

  // TestConditionals
  it("tests conditionals", () => {
    compileStory("conditionals");

    expect(context.story.ContinueMaximally()).toBe(
      "true\ntrue\ntrue\ntrue\ntrue\ngreat\nright?\n"
    );
  });

  // TestElseBranches
  it("tests else branches", () => {
    compileStory("else_branches");

    expect(context.story.ContinueMaximally()).toBe(
      "other\nother\nother\nother\n"
    );
  });

  // TestEmptyMultilineConditionalBranch
  it("tests empty multiline conditional branch", () => {
    compileStory("empty_multiline_conditional_branch");

    expect(context.story.Continue()).toBe("");
  });

  // TestTrivialCondition
  it("tests trivial condition", () => {
    compileStory("trivial_condition");

    context.story.Continue();
  });
});
