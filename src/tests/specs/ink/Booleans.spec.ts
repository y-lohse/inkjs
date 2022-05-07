import * as testsUtils from "../common";

describe("Booleans", () => {
  let context: testsUtils.TestContext;

  function compileStory(
    name: string,
    countAllVisits: boolean = false,
    testingErrors: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "booleans",
      countAllVisits,
      testingErrors
    );
  }

  afterEach(() => {
    context = new testsUtils.TestContext();
  });

  // TestBools
  it("tests bools", () => {
    compileStory("true");
    expect(context.story.Continue()).toBe("true\n");

    compileStory("true_plus_one");
    expect(context.story.Continue()).toBe("2\n");

    compileStory("two_plus_true");
    expect(context.story.Continue()).toBe("3\n");

    compileStory("false_plus_false");
    expect(context.story.Continue()).toBe("0\n");

    compileStory("true_plus_true");
    expect(context.story.Continue()).toBe("2\n");

    compileStory("true_equals_one");
    expect(context.story.Continue()).toBe("true\n");

    compileStory("not_one");
    expect(context.story.Continue()).toBe("false\n");

    compileStory("not_true");
    expect(context.story.Continue()).toBe("false\n");

    compileStory("three_greater_than_one");
    expect(context.story.Continue()).toBe("true\n");

    compileStory("list_hasnt");
    expect(context.story.Continue()).toBe("true\n");
  });
});
