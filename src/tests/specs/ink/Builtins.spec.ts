import * as testsUtils from "../common";

describe("Builtins", () => {
  let story: any;

  function loadStory(name: string) {
    story = testsUtils.loadInkFile(name, "builtins");
  }

  beforeEach(() => {
    story = undefined;
  });

  it("tests floor, ceiling and casts", () => {
    loadStory("floor_ceiling_and_casts");
    expect(story.ContinueMaximally()).toBe(
      "1\n1\n2\n0.6666666666666666\n0\n1\n"
    );
  });

  it("tests read count accross callstack", () => {
    loadStory("read_count_across_callstack");
    expect(story.ContinueMaximally()).toBe(
      "1) Seen first 1 times.\nIn second.\n2) Seen first 1 times.\n"
    );
  });

  it("tests read count accross threads", () => {
    loadStory("read_count_across_threads");
    expect(story.ContinueMaximally()).toBe("1\n1\n");
  });

  it("tests read count dot deperated path", () => {
    loadStory("read_count_dot_separated_path");
    expect(story.ContinueMaximally()).toBe("hi\nhi\nhi\n3\n");
  });

  it("tests nested turns since", () => {
    loadStory("turns_since_nested");

    expect(story.ContinueMaximally()).toBe("-1 = -1\n");

    expect(story.currentChoices.length).toBe(1);
    story.ChooseChoiceIndex(0);
    expect(story.ContinueMaximally()).toBe("stuff\n0 = 0\n");

    expect(story.currentChoices.length).toBe(1);
    story.ChooseChoiceIndex(0);
    expect(story.ContinueMaximally()).toBe("more stuff\n1 = 1\n");
  });

  it("tests nested turns since", () => {
    loadStory("turns_since_with_variable_target");

    expect(story.ContinueMaximally()).toBe("0\n0\n");

    expect(story.currentChoices.length).toBe(1);
    story.ChooseChoiceIndex(0);
    expect(story.ContinueMaximally()).toBe("1\n");
  });

  it("tests turns since", () => {
    loadStory("turns_since");

    expect(story.ContinueMaximally()).toBe("-1\n0\n");

    story.ChooseChoiceIndex(0);
    expect(story.ContinueMaximally()).toBe("1\n");

    story.ChooseChoiceIndex(0);
    expect(story.ContinueMaximally()).toBe("2\n");
  });

  it("tests turns", () => {
    loadStory("turns");

    for (let i = 0; i < 10; i++) {
      expect(story.Continue()).toBe(`${i}\n`);
      story.ChooseChoiceIndex(0);
    }
  });

  it("tests visit counts when choosing", () => {
    loadStory("visit_counts_when_choosing");

    expect(story.state.VisitCountAtPathString("TestKnot")).toBe(0);
    expect(story.state.VisitCountAtPathString("TestKnot2")).toBe(0);

    story.ChoosePathString("TestKnot");

    expect(story.state.VisitCountAtPathString("TestKnot")).toBe(1);
    expect(story.state.VisitCountAtPathString("TestKnot2")).toBe(0);

    story.Continue();

    expect(story.state.VisitCountAtPathString("TestKnot")).toBe(1);
    expect(story.state.VisitCountAtPathString("TestKnot2")).toBe(0);

    story.ChooseChoiceIndex(0);

    expect(story.state.VisitCountAtPathString("TestKnot")).toBe(1);
    expect(story.state.VisitCountAtPathString("TestKnot2")).toBe(0);

    story.Continue();

    expect(story.state.VisitCountAtPathString("TestKnot")).toBe(1);
    expect(story.state.VisitCountAtPathString("TestKnot2")).toBe(1);
  });

  it("tests visit count bug due to nested containers", () => {
    loadStory("visit_count_bug_due_to_nested_containers");

    expect(story.Continue()).toBe("1\n");

    story.ChooseChoiceIndex(0);
    expect(story.ContinueMaximally()).toBe("choice\n1\n");
  });
});
