import * as testsUtils from "../common";

describe("Extra", () => {
  let story: any;

  function loadStory(name: any) {
    story = testsUtils.loadInkFile(name, "extra");
  }

  beforeEach(() => {
    story = undefined;
  });

  it("tests arithmetic", () => {
    loadStory("arithmetic_2");

    expect(story.ContinueMaximally()).toBe(
      "2\n2.3333333333333335\n2.3333333333333335\n2.3333333333333335\n2.3333333333333335\n2.3333333333333335\n"
    );
  });
});
