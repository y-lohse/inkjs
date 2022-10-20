import * as testsUtils from "../../common";

describe("Tags", () => {
  let context: testsUtils.TestContext;

  beforeEach(() => {
    // context = testsUtils.fromJsonTestContext("tests", "inkjs");
    context = testsUtils.makeDefaultTestContext("tests", "inkjs", true);
    context.story.allowExternalFunctionFallbacks = true;
  });

  it("should find global tags", () => {
    let tags = context.story.globalTags;

    expect(tags.length).toBe(1);
    expect(tags[0]).toEqual("global tag");
  });

  it("should find knot level tags", () => {
    let tags = context.story.TagsForContentAtPath("tags");

    expect(tags.length).toBe(1);
    expect(tags[0]).toEqual("knot tag");
  });

  it("should find line by line tags", () => {
    context.story.ChoosePathString("tags.line_by_Line");
    context.story.Continue();

    let tags = context.story.currentTags;

    expect(tags.length).toBe(1);
    expect(tags[0]).toEqual("a tag");

    context.story.Continue();
    tags = context.story.currentTags;

    expect(tags.length).toBe(2);
    expect(tags[0]).toEqual("tag1");
    expect(tags[1]).toEqual("tag2");

    context.story.Continue();
    tags = context.story.currentTags;

    expect(tags.length).toBe(2);
    expect(tags[0]).toEqual("tag above");
    expect(tags[1]).toEqual("tag after");
  });

  it("should find tags on choice points", () => {
    context.story.ChoosePathString("tags.choice");
    context.story.Continue();

    expect(context.story.currentChoices.length).toEqual(1);
    expect(context.story.currentChoices[0].text).toEqual("a choice");
    expect(context.story.currentTags.length).toEqual(0);

    context.story.ChooseChoiceIndex(0);

    expect(context.story.Continue()).toEqual("a choice\n");
    expect(context.story.currentTags.length).toEqual(1);
    expect(context.story.currentTags[0]).toEqual("a tag");
  });

  it("should handle tag edge cases", () => {
    context.story.ChoosePathString("tags.weird");
    context.story.Continue();

    let tags = context.story.currentTags;

    expect(tags.length).toBe(2);
    expect(tags[0]).toEqual("space around");
    expect(tags[1]).toEqual("0");
  });
});
