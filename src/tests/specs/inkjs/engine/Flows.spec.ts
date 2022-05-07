import * as testsUtils from "../../common";

describe("Flow control", () => {
  let context: testsUtils.TestContext;

  beforeEach(() => {
    context = testsUtils.makeDefaultTestContext("tests", "inkjs", true);
    context.story.allowExternalFunctionFallbacks = true;
  });

  it("should go through a tunnel", () => {
    context.story.ChoosePathString("flow_control.tunnel_call");
    expect(context.story.Continue()).toEqual("tunnel end\n");
    expect(context.story.canContinue).toBe(false);
  });

  it("should follow threads", () => {
    context.story.ChoosePathString("flow_control.thread");
    expect(context.story.Continue()).toEqual("thread start\n");
    expect(context.story.Continue()).toEqual("threaded text\n");
    expect(context.story.Continue()).toEqual("thread end\n");

    expect(context.story.canContinue).toBe(false);
    expect(context.story.currentChoices.length).toEqual(2);
    expect(context.story.currentChoices[0].text).toEqual(
      "first threaded choice"
    );
    expect(context.story.currentChoices[1].text).toEqual(
      "second threaded choice"
    );

    context.story.ChooseChoiceIndex(0);
    expect(context.story.Continue()).toEqual("first threaded choice\n");
    expect(context.story.canContinue).toBe(false);
  });
});
