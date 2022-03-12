import * as testsUtils from "../../common";

describe("Content", () => {
  let context: testsUtils.TestContext;

  beforeEach(() => {
    context = testsUtils.makeDefaultTestContext("tests", "inkjs", true);
    context.story.allowExternalFunctionFallbacks = true;
  });

  it("should read simple content", () => {
    context.story.ChoosePathString("content.simple");

    expect(context.story.Continue()).toEqual("Simple content inside a knot\n");
  });

  it("should read multiline content", () => {
    context.story.ChoosePathString("content.multiline");

    expect(context.story.Continue()).toEqual("First line\n");
    expect(context.story.canContinue).toBeTruthy();
    expect(context.story.Continue()).toEqual("Second line\n");
  });

  it("should print a variable", () => {
    context.story.ChoosePathString("content.variable_text");

    expect(context.story.Continue()).toEqual("variable text\n");
  });

  it("should print a truthy conditional text", () => {
    context.story.ChoosePathString("content.if_text_truthy");

    expect(context.story.Continue()).toEqual(
      "I… I saw him. Only for a moment.\n"
    );
  });

  it("should print a falsy conditional text", () => {
    context.story.ChoosePathString("content.if_text_falsy");
    expect(context.story.Continue()).toEqual("I…\n");
  });

  it("should handle an if/else text", () => {
    context.story.ChoosePathString("content.if_else_text");

    expect(context.story.Continue()).toEqual("I saw him. Only for a moment.\n");
    expect(context.story.Continue()).toEqual(
      "I missed him. Was he particularly evil?\n"
    );
  });
});

describe("Glue", () => {
  let context: testsUtils.TestContext;

  beforeEach(() => {
    context = testsUtils.makeDefaultTestContext("tests", "inkjs", true);
    context.story.allowExternalFunctionFallbacks = true;
  });

  it("should glue lines together", () => {
    context.story.ChoosePathString("glue.simple");

    expect(context.story.Continue()).toEqual("Simple glue\n");
  });

  it("should glue diverts together", () => {
    context.story.ChoosePathString("glue.diverted_glue");

    expect(context.story.Continue()).toEqual("More glue\n");
  });
});

describe("Divert", () => {
  let context: testsUtils.TestContext;

  beforeEach(() => {
    context = testsUtils.makeDefaultTestContext("tests", "inkjs", true);
    context.story.allowExternalFunctionFallbacks = true;
  });

  it("should divert to a knot", () => {
    context.story.ChoosePathString("divert.divert_knot");

    expect(context.story.Continue()).toEqual("Diverted to a knot\n");
  });

  it("should divert to a stitch", () => {
    context.story.ChoosePathString("divert.divert_stitch");

    expect(context.story.Continue()).toEqual("Diverted to a stitch\n");
  });

  it("should divert to an internal stitch", () => {
    context.story.ChoosePathString("divert.internal_stitch");

    expect(context.story.Continue()).toEqual("Diverted to internal stitch\n");
  });

  it("should divert with a variable", () => {
    context.story.ChoosePathString("divert.divert_var");

    expect(context.story.Continue()).toEqual("Diverted with a variable\n");
  });
});

describe("Game Queries", () => {
  let context: testsUtils.TestContext;

  beforeEach(() => {
    context = testsUtils.makeDefaultTestContext("tests", "inkjs", true);
    context.story.allowExternalFunctionFallbacks = true;
  });

  it("should reuturn a choice count", () => {
    context.story.ChoosePathString("game_queries.choicecount");
    context.story.Continue();

    expect(context.story.currentChoices.length).toEqual(1);
    expect(context.story.currentChoices[0].text).toEqual("count 0");

    context.story.ChooseChoiceIndex(0);
    context.story.Continue();

    expect(context.story.currentChoices.length).toEqual(2);
    expect(context.story.currentChoices[1].text).toEqual("count 1");

    context.story.ChooseChoiceIndex(0);
    context.story.Continue();

    expect(context.story.currentChoices.length).toEqual(3);
    expect(context.story.currentChoices[2].text).toEqual("count 2");

    context.story.ChooseChoiceIndex(0);
    context.story.Continue();

    expect(context.story.currentChoices.length).toEqual(4);
    expect(context.story.currentChoices[1].text).toEqual("count 1");
    expect(context.story.currentChoices[3].text).toEqual("count 3");
  });

  it("should return a turn since count", () => {
    context.story.ChoosePathString("game_queries.turnssince_before");
    expect(context.story.Continue()).toEqual("-1\n");
    expect(context.story.Continue()).toEqual("0\n");

    expect(context.story.currentChoices.length).toEqual(1);
    context.story.ChooseChoiceIndex(0);
    expect(context.story.Continue()).toEqual("1\n");

    expect(context.story.currentChoices.length).toEqual(1);
    context.story.ChooseChoiceIndex(0);
    expect(context.story.Continue()).toEqual("2\n");
  });
});
