import * as testsUtils from "../common";

describe("Tags", () => {
  let context: testsUtils.TestContext;

  function compileStory(
    name: string,
    countAllVisits: boolean = false,
    testingErrors: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "tags",
      countAllVisits,
      testingErrors
    );
  }

  afterEach(() => {
    context = new testsUtils.TestContext();
  });

  // TestTags
  it("tests string constants", () => {
    compileStory("tags");

    let globalTags = ["author: Joe", "title: My Great Story"];
    let knotTags = ["knot tag"];
    let knotTagsWhenContinuedTwiceTags = ["end of knot tag"];
    let stitchTags = ["stitch tag"];

    expect(context.story.globalTags).toEqual(globalTags);
    expect(context.story.Continue()).toBe("This is the content\n");
    expect(context.story.currentTags).toEqual(globalTags);

    expect(context.story.TagsForContentAtPath("knot")).toEqual(knotTags);
    expect(context.story.TagsForContentAtPath("knot.stitch")).toEqual(
      stitchTags
    );

    context.story.ChoosePathString("knot");
    expect(context.story.Continue()).toBe("Knot content\n");
    expect(context.story.currentTags).toEqual(knotTags);
    expect(context.story.Continue()).toBe("");
    expect(context.story.currentTags).toEqual(knotTagsWhenContinuedTwiceTags);
  });

  // TestTagOnChoice
  it("tests tag on choice", () => {
    compileStory("tag_on_choice");

    context.story.Continue();
    context.story.ChooseChoiceIndex(0);

    let txt = context.story.Continue();
    let tags = context.story.currentTags;

    expect(txt).toEqual("Hello");
    expect(tags.length).toEqual(1);
    expect(tags[0]).toEqual("hey");
  });
});
