import * as testsUtils from "../common";

describe("Booleans", () => {
  let story: any;

  function loadStory(name: string) {
    story = testsUtils.loadInkFile(name, "booleans");
  }

  beforeEach(() => {
    story = undefined;
  });

  it("tests bools", () => {
    loadStory("true");
    expect(story.Continue()).toBe("true\n");

    loadStory("true_plus_one");
    expect(story.Continue()).toBe("2\n");

    loadStory("two_plus_true");
    expect(story.Continue()).toBe("3\n");

    loadStory("false_plus_false");
    expect(story.Continue()).toBe("0\n");

    loadStory("true_plus_true");
    expect(story.Continue()).toBe("2\n");

    loadStory("true_equals_one");
    expect(story.Continue()).toBe("true\n");

    loadStory("not_one");
    expect(story.Continue()).toBe("false\n");

    loadStory("not_true");
    expect(story.Continue()).toBe("false\n");

    loadStory("three_reater_than_one");
    expect(story.Continue()).toBe("true\n");

    loadStory("list_hasnt");
    expect(story.Continue()).toBe("true\n");
  });
});
