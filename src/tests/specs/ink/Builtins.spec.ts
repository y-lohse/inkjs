import * as testsUtils from "../common";

describe("Builtins", () => {
  let context: testsUtils.TestContext;

  function compileStory(
    name: string,
    countAllVisits: boolean = false,
    testingErrors: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "builtins",
      countAllVisits,
      testingErrors
    );
  }

  afterEach(() => {
    context = new testsUtils.TestContext();
  });

  // TestFloorCeilingAndCasts
  it("tests floor, ceiling and casts", () => {
    compileStory("floor_ceiling_and_casts");
    expect(context.story.ContinueMaximally()).toBe(
      "1\n1\n2\n0.6666666666666666\n0\n1\n"
    );
  });

  // TestReadCountAcrossCallstack
  it("tests read count accross callstack", () => {
    compileStory("read_count_across_callstack");
    expect(context.story.ContinueMaximally()).toBe(
      "1) Seen first 1 times.\nIn second.\n2) Seen first 1 times.\n"
    );
  });

  // TestReadCountAcrossThreads
  it("tests read count accross threads", () => {
    compileStory("read_count_across_threads");
    expect(context.story.ContinueMaximally()).toBe("1\n1\n");
  });

  // TestReadCountDotSeparatedPath
  it("tests read count dot deperated path", () => {
    compileStory("read_count_dot_separated_path");
    expect(context.story.ContinueMaximally()).toBe("hi\nhi\nhi\n3\n");
  });

  // TestReadCountVariableTarget
  it("tests read count variable target", () => {
    compileStory("read_count_variable_target", true);
    expect(context.story.ContinueMaximally()).toBe(
      "Count start: 0 0 0\n1\n2\n3\nCount end: 3 3 3\n"
    );
  });

  // TestTurnsSinceNested
  it("tests turns since nested", () => {
    compileStory("turns_since_nested");

    expect(context.story.ContinueMaximally()).toBe("-1 = -1\n");

    expect(context.story.currentChoices.length).toBe(1);
    context.story.ChooseChoiceIndex(0);
    expect(context.story.ContinueMaximally()).toBe("stuff\n0 = 0\n");

    expect(context.story.currentChoices.length).toBe(1);
    context.story.ChooseChoiceIndex(0);
    expect(context.story.ContinueMaximally()).toBe("more stuff\n1 = 1\n");
  });

  // TestTurnsSinceWithVariableTarget
  it("tests turns since with variable target", () => {
    compileStory("turns_since_with_variable_target", true);

    expect(context.story.ContinueMaximally()).toBe("0\n0\n");

    expect(context.story.currentChoices.length).toBe(1);
    context.story.ChooseChoiceIndex(0);
    expect(context.story.ContinueMaximally()).toBe("1\n");
  });

  // TestTurnsSince
  it("tests turns since", () => {
    compileStory("turns_since");

    expect(context.story.ContinueMaximally()).toBe("-1\n0\n");

    context.story.ChooseChoiceIndex(0);
    expect(context.story.ContinueMaximally()).toBe("1\n");

    context.story.ChooseChoiceIndex(0);
    expect(context.story.ContinueMaximally()).toBe("2\n");
  });

  // TestTurns
  it("tests turns", () => {
    compileStory("turns");

    for (let i = 0; i < 10; i++) {
      expect(context.story.Continue()).toBe(`${i}\n`);
      context.story.ChooseChoiceIndex(0);
    }
  });

  // TestVisitCountsWhenChoosing
  it("tests visit counts when choosing", () => {
    compileStory("visit_counts_when_choosing", true);

    expect(context.story.state.VisitCountAtPathString("TestKnot")).toBe(0);
    expect(context.story.state.VisitCountAtPathString("TestKnot2")).toBe(0);

    context.story.ChoosePathString("TestKnot");

    expect(context.story.state.VisitCountAtPathString("TestKnot")).toBe(1);
    expect(context.story.state.VisitCountAtPathString("TestKnot2")).toBe(0);

    context.story.Continue();

    expect(context.story.state.VisitCountAtPathString("TestKnot")).toBe(1);
    expect(context.story.state.VisitCountAtPathString("TestKnot2")).toBe(0);

    context.story.ChooseChoiceIndex(0);

    expect(context.story.state.VisitCountAtPathString("TestKnot")).toBe(1);
    expect(context.story.state.VisitCountAtPathString("TestKnot2")).toBe(0);

    context.story.Continue();

    expect(context.story.state.VisitCountAtPathString("TestKnot")).toBe(1);
    expect(context.story.state.VisitCountAtPathString("TestKnot2")).toBe(1);
  });

  // TestVisitCountBugDueToNestedContainers
  it("tests visit count bug due to nested containers", () => {
    compileStory("visit_count_bug_due_to_nested_containers");

    expect(context.story.Continue()).toBe("1\n");

    context.story.ChooseChoiceIndex(0);
    expect(context.story.ContinueMaximally()).toBe("choice\n1\n");
  });
});
