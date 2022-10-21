import * as testsUtils from "../common";

describe("Diverts", () => {
  let context: testsUtils.TestContext;

  function compileStory(
    name: string,
    countAllVisits: boolean = false,
    testingErrors: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "diverts",
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
      "diverts/compiler",
      countAllVisits,
      true
    );
  }

  afterEach(() => {
    context = new testsUtils.TestContext();
  });

  // TestBasicTunnel
  it("tests basic tunnel", () => {
    compileStory("basic_tunnel");

    expect(context.story.Continue()).toBe("Hello world\n");
  });

  // TestCompareDivertTargets
  it("tests compare divert targets", () => {
    compileStory("compare_divert_targets");

    expect(context.story.ContinueMaximally()).toBe(
      "different knot\nsame knot\nsame knot\ndifferent knot\nsame knot\nsame knot\n"
    );
  });

  // TestComplexTunnels
  it("tests complex tunnels", () => {
    compileStory("complex_tunnels");

    // TODO: Local to determine decimal separator (+ check compiler code).
    expect(context.story.ContinueMaximally()).toBe(
      "one (1)\none and a half (1.5)\ntwo (2)\nthree (3)\n"
    );
  });

  // TestDivertInConditional
  it("tests divert in conditional", () => {
    compileStory("divert_in_conditional");

    expect(context.story.ContinueMaximally()).toBe("");
  });

  // TestDivertTargetsWithParameters
  it("tests divert targets with parameters", () => {
    compileStory("divert_targets_with_parameters");

    expect(context.story.ContinueMaximally()).toBe("5\n");
  });

  it("tests divert to weave points", () => {
    compileStory("divert_to_weave_points");

    expect(context.story.ContinueMaximally()).toBe(
      "gather\ntest\nchoice content\ngather\nsecond time round\n"
    );
  });

  // TestDoneStopsThread
  it("tests done stop thread", () => {
    compileStory("done_stops_thread");

    expect(context.story.ContinueMaximally()).toBe("");
  });

  // TestPathToSelf
  it("tests path to self", () => {
    compileStory("path_to_self");

    context.story.Continue();
    context.story.ChooseChoiceIndex(0);

    context.story.Continue();
    context.story.ChooseChoiceIndex(0);

    expect(context.story.canContinue).toBe(true);
  });

  // TestSameLineDivertIsInline
  it("tests same line divert is inline", () => {
    compileStory("same_line_divert_is_inline");

    expect(context.story.Continue()).toBe(
      "We hurried home to Savile Row as fast as we could.\n"
    );
  });

  // TestTunnelOnwardsAfterTunnel
  it("tests tunnel onwards after tunnel", () => {
    compileStory("tunnel_onwards_after_tunnel");

    expect(context.story.ContinueMaximally()).toBe(
      "Hello...\n...world.\nThe End.\n"
    );
  });

  // TestTunnelOnwardsDivertAfterWithArg
  it("tests tunnel onwards divert after with arg", () => {
    compileStory("tunnel_onwards_divert_after_with_arg");

    expect(context.story.ContinueMaximally()).toBe("8\n");
  });

  // TestTunnelOnwardsDivertOverride
  it("tests tunnel onwards divert override", () => {
    compileStory("tunnel_onwards_divert_override");

    expect(context.story.ContinueMaximally()).toBe("This is A\nNow in B.\n");
  });

  // TestTunnelOnwardsWithParamDefaultChoice
  it("tests tunnel onwardswith param default choice", () => {
    compileStory("tunnel_onwards_with_param_default_choice");

    expect(context.story.ContinueMaximally()).toBe("8\n");
  });

  // TestTunnelVsThreadBehaviour
  it("tests tunnel vs thread behaviour", () => {
    compileStory("tunnel_vs_thread_behaviour");

    expect(context.story.ContinueMaximally()).not.toMatch("Finished tunnel");
    expect(context.story.currentChoices.length).toBe(2);

    context.story.ChooseChoiceIndex(0);

    expect(context.story.ContinueMaximally()).toMatch("Finished tunnel");
    expect(context.story.currentChoices.length).toBe(3);

    context.story.ChooseChoiceIndex(2);

    expect(context.story.ContinueMaximally()).toMatch("Done.");
  });

  // TestDivertNotFoundError
  it("tests divert not found error", () => {
    compileStoryWithoutRuntime("divert_not_found_error");

    expect(context.errorMessages).toContainStringContaining("not found");
  });

  // TestDisallowEmptyDiverts
  it("tests disallow empty diverts", () => {
    compileStoryWithoutRuntime("disallow_empty_diverts");

    expect(context.errorMessages).toContainStringContaining(
      "Empty diverts (->) are only valid on choices"
    );
  });

  // TestTunnelOnwardsToVariableDivertTarget
  it("tests variable divert target in tunnel onward", () => {
    compileStory("tunnel_onwards_to_variable_divert_target");

    expect(context.story.ContinueMaximally()).toMatch(
      "This is outer\nThis is the_esc\n"
    );
  });
});
