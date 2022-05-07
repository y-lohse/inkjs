import * as testsUtils from "../../common";

describe("Simple lists", () => {
  let context: testsUtils.TestContext;

  beforeEach(() => {
    context = testsUtils.makeDefaultTestContext("tests", "inkjs", true);
    context.story.allowExternalFunctionFallbacks = true;
  });

  it("should go through a sequence", () => {
    context.story.ChoosePathString("simple_lists.sequence");
    expect(context.story.Continue()).toEqual("one\n");

    context.story.ChoosePathString("simple_lists.sequence");
    expect(context.story.Continue()).toEqual("two\n");

    context.story.ChoosePathString("simple_lists.sequence");
    expect(context.story.Continue()).toEqual("three\n");

    context.story.ChoosePathString("simple_lists.sequence");
    expect(context.story.Continue()).toEqual("final\n");

    context.story.ChoosePathString("simple_lists.sequence");
    expect(context.story.Continue()).toEqual("final\n");
  });

  it("should go through a cycle", () => {
    let results = ["one\n", "two\n", "three\n"];

    for (let i = 0; i < 10; ++i) {
      context.story.ChoosePathString("simple_lists.cycle");
      expect(context.story.Continue()).toEqual(results[i % 3]);
    }
  });

  it("should go through a list once", () => {
    context.story.ChoosePathString("simple_lists.once");
    expect(context.story.Continue()).toEqual("one\n");

    context.story.ChoosePathString("simple_lists.once");
    expect(context.story.Continue()).toEqual("two\n");

    context.story.ChoosePathString("simple_lists.once");
    expect(context.story.Continue()).toEqual("three\n");

    context.story.ChoosePathString("simple_lists.once");
    expect(context.story.Continue()).toEqual("");
  });

  it("should go through a shuffle", () => {
    let results = ["heads\n", "tails\n"];

    for (let i = 0; i < 40; ++i) {
      context.story.ChoosePathString("simple_lists.shuffle");
      expect(results).toContain(context.story.Continue());
    }
  });

  it("should handle blank elements", () => {
    for (let i = 0; i < 3; ++i) {
      context.story.ChoosePathString("simple_lists.blanks");
      expect(context.story.Continue()).toEqual("");
    }

    context.story.ChoosePathString("simple_lists.blanks");
    expect(context.story.Continue()).toEqual("end\n");
  });
});
