import * as testsUtils from "../common";

describe("Strings", () => {
  let context: testsUtils.TestContext;

  function compileStory(
    name: string,
    countAllVisits: boolean = false,
    testingErrors: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "strings",
      countAllVisits,
      testingErrors
    );
  }

  afterEach(() => {
    context = new testsUtils.TestContext();
  });

  // TestStringConstants
  it("tests string constants", () => {
    compileStory("string_constants");

    expect(context.story.Continue()).toBe("hi\n");
  });

  // TestStringContains
  it("tests string contains", () => {
    compileStory("string_contains");

    expect(context.story.ContinueMaximally()).toBe("true\nfalse\ntrue\ntrue\n");
  });

  // TestStringTypeCoersion (sic – don't fix the typo)
  it("tests string type coercion", () => {
    compileStory("string_type_coercion");

    expect(context.story.ContinueMaximally()).toBe("same\ndifferent\n");
  });

  // TestStringsInChoices
  it("tests string in choices", () => {
    compileStory("strings_in_choices");

    context.story.ContinueMaximally();

    expect(context.story.currentChoices.length).toBe(1);
    expect(context.story.currentChoices[0].text).toBe('test1 "test2 test3"');

    context.story.ChooseChoiceIndex(0);
    expect(context.story.Continue()).toBe("test1 test4\n");
  });
});
