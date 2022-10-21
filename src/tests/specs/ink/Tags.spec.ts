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

  //TestTagsInSeq
  it("tests tags in a sequence", () => {
    compileStory("tags_in_seq");

    expect(context.story.Continue()).toBe("A red sequence.\n");
    expect(context.story.currentTags).toEqual(["red"]);

    expect(context.story.Continue()).toBe("A white sequence.\n");
    expect(context.story.currentTags).toEqual(["white"]);
  });

  //TestTagsDynamicContent
  it("tests dynamic content in tags", () => {
    compileStory("tags_dynamic_content");

    expect(context.story.Continue()).toBe("tag\n");
    expect(context.story.currentTags).toEqual(["pic8red.jpg"]);
  });
});
