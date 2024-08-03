import * as testsUtils from "../common";

describe("Lists", () => {
  let context: testsUtils.TestContext;

  function compileStory(
    name: string,
    countAllVisits: boolean = false,
    testingErrors: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "lists",
      countAllVisits,
      testingErrors
    );
  }

  afterEach(() => {
    context = new testsUtils.TestContext();
  });

  // TestEmptyListOrigin
  it("tests empty list origin", () => {
    compileStory("empty_list_origin");

    expect(context.story.Continue()).toBe("a, b\n");
  });

  // TestEmptyListOriginAfterAssignment
  it("tests empty list origin", () => {
    compileStory("empty_list_origin_after_assignment");

    expect(context.story.ContinueMaximally()).toBe("a, b, c\n");
  });

  // TestListBasicOperations
  it("tests list basic operations", () => {
    compileStory("list_basic_operations");

    expect(context.story.ContinueMaximally()).toBe(
      "b, d\na, b, c, e\nb, c\nfalse\ntrue\ntrue\n"
    );
  });

  // TestListMixedItems
  it("tests list mixed items", () => {
    compileStory("list_mixed_items");

    expect(context.story.ContinueMaximally()).toBe("a, y, c\n");
  });

  // TestListRandom
  it("tests list random", () => {
    compileStory("list_random");

    while (context.story.canContinue) {
      let result = context.story.Continue();
      expect(result == "B\n" || result == "C\n" || result == "D\n").toBe(true);
    }
  });

  // TestListRange
  it("tests list range", () => {
    compileStory("list_range");

    expect(context.story.ContinueMaximally()).toBe(
      `Pound, Pizza, Euro, Pasta, Dollar, Curry, Paella
Euro, Pasta, Dollar, Curry
Two, Three, Four, Five, Six
One, Two, Three
Two, Three, Four
Two, Three, Four, Five
Pizza, Pasta
`
    );
  });

  // TestListSaveLoad
  it("tests list save load", () => {
    compileStory("list_save_load");

    expect(context.story.ContinueMaximally()).toBe("a, x, c\n");

    let savedState = context.story.state.ToJson();

    compileStory("list_save_load");
    context.story.state.LoadJson(savedState);

    context.story.ChoosePathString("elsewhere");
    expect(context.story.ContinueMaximally()).toBe("a, x, c, z\n");
  });

  // TestMoreListOperations
  it("tests more list operations", () => {
    compileStory("more_list_operations");

    expect(context.story.ContinueMaximally()).toBe("1\nl\nn\nl, m\nn\n");
  });

  // TestContainsEmptyListAlwaysFalse
  it("tests list doest not contain empty list", () => {
    compileStory("contains_empty_list_always_false");

    expect(context.story.ContinueMaximally()).toBe("false\nfalse\nfalse\n");
  });
});
