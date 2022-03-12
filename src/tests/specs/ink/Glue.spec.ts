import * as testsUtils from "../common";

describe("Glue", () => {
  let context: testsUtils.TestContext;

  function compileStory(
    name: string,
    countAllVisits: boolean = false,
    testingErrors: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "glue",
      countAllVisits,
      testingErrors
    );
  }

  afterEach(() => {
    context = new testsUtils.TestContext();
  });

  // TestImplicitInlineGlue
  it("tests implicit inline glue", () => {
    compileStory("implicit_inline_glue");

    expect(context.story.Continue()).toBe("I have five eggs.\n");
  });

  // TestImplicitInlineGlueB
  it("tests implicit inline glue b", () => {
    compileStory("implicit_inline_glue_b");

    expect(context.story.ContinueMaximally()).toBe("A\nX\n");
  });

  // TestImplicitInlineGlueC
  it("tests implicit inline glue c", () => {
    compileStory("implicit_inline_glue_c");

    expect(context.story.ContinueMaximally()).toBe("A\nC\n");
  });

  // TestLeftRightGlueMatching
  it("tests left right glue matching", () => {
    compileStory("left_right_glue_matching");

    expect(context.story.ContinueMaximally()).toBe("A line.\nAnother line.\n");
  });

  // TestSimpleGlue
  it("tests simple glue", () => {
    compileStory("simple_glue");

    expect(context.story.Continue()).toBe("Some content with glue.\n");
  });
});
