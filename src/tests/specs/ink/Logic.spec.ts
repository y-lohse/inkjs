import * as testsUtils from "../common";

describe("Logic", () => {
  let context: testsUtils.TestContext;

  function compileStory(
    name: string,
    countAllVisits: boolean = false,
    testingErrors: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "logic",
      countAllVisits,
      testingErrors
    );
  }

  afterEach(() => {
    context = new testsUtils.TestContext();
  });

  // TestLogicLinesWithNewlines
  it("tests logic lines with newlines", () => {
    compileStory("logic_lines_with_newlines");

    expect(context.story.ContinueMaximally()).toBe(
      "text1\ntext 2\ntext1\ntext 2\n"
    );
  });

  // TestMultilineLogicWithGlue
  it("tests multiline logic with glue", () => {
    compileStory("multiline_logic_with_glue");

    expect(context.story.ContinueMaximally()).toBe("a b\na b\n");
  });

  // TestNestedPassByReference
  it("tests nested pass by reference", () => {
    compileStory("nested_pass_by_reference");

    expect(context.story.ContinueMaximally()).toBe("5\n625\n");
  });

  // TestPrintNum
  it("tests print num", () => {
    compileStory("print_num");

    expect(context.story.ContinueMaximally()).toBe(
      ". four .\n. fifteen .\n. thirty-seven .\n. one hundred and one .\n. two hundred and twenty-two .\n. one thousand two hundred and thirty-four .\n"
    );
  });
});
