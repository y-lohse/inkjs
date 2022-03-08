import * as testsUtils from "../common";

describe("Newlines", () => {
  let context: testsUtils.TestContext;

  function compileStory(
    name: string,
    countAllVisits: boolean = false,
    testingErrors: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "newlines",
      countAllVisits,
      testingErrors
    );
  }

  afterEach(() => {
    context = new testsUtils.TestContext();
  });

  // TestNewlineAtStartOfMultilineConditional
  it("tests newline at start of multiline conditional", () => {
    compileStory("newline_at_start_of_multiline_conditional");

    expect(context.story.ContinueMaximally()).toBe("X\nx\n");
  });

  // TestNewlineConsistency
  it("tests newline consistency", () => {
    compileStory("newline_consistency_1");
    expect(context.story.ContinueMaximally()).toBe("hello world\n");

    compileStory("newline_consistency_2");
    context.story.Continue();
    context.story.ChooseChoiceIndex(0);
    expect(context.story.ContinueMaximally()).toBe("hello world\n");

    compileStory("newline_consistency_3");
    context.story.Continue();
    context.story.ChooseChoiceIndex(0);
    expect(context.story.ContinueMaximally()).toBe("hello\nworld\n");
  });

  // TestNewlinesTrimmingWithFuncExternalFallback
  it("tests newlines trimming with func external fallback", () => {
    compileStory("newlines_trimming_with_func_external_fallback");
    context.story.allowExternalFunctionFallbacks = true;

    expect(context.story.ContinueMaximally()).toBe("Phrase 1\nPhrase 2\n");
  });

  // TestNewlinesWithStringEval
  it("tests newlines trimming with string eval", () => {
    compileStory("newlines_with_string_eval");

    expect(context.story.ContinueMaximally()).toBe("A\nB\nA\n3\nB\n");
  });
});
