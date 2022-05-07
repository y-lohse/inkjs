import * as testsUtils from "../common";

describe("Extra", () => {
  let context: testsUtils.TestContext;

  function compileStory(
    name: string,
    countAllVisits: boolean = false,
    testingErrors: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "extra",
      countAllVisits,
      testingErrors
    );
  }

  afterEach(() => {
    context = new testsUtils.TestContext();
  });

  it("tests arithmetic", () => {
    compileStory("arithmetic_2");

    expect(context.story.ContinueMaximally()).toBe(
      "2\n2.3333333333333335\n2.3333333333333335\n2.3333333333333335\n2.3333333333333335\n2.3333333333333335\n"
    );
  });
});
