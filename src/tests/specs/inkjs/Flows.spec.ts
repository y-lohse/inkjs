import * as testsUtils from "../common";

describe("Flow control", () => {
  let story: any;
  beforeEach(() => {
    story = testsUtils.loadInkFile("tests", "inkjs");
    story.allowExternalFunctionFallbacks = true;
  });

  it("should go through a tunnel", () => {
    story.ChoosePathString("flow_control.tunnel_call");
    expect(story.Continue()).toEqual("tunnel end\n");
    expect(story.canContinue).toBe(false);
  });

  it("should follow threads", () => {
    story.ChoosePathString("flow_control.thread");
    expect(story.Continue()).toEqual("thread start\n");
    expect(story.Continue()).toEqual("threaded text\n");
    expect(story.Continue()).toEqual("thread end\n");

    expect(story.canContinue).toBe(false);
    expect(story.currentChoices.length).toEqual(2);
    expect(story.currentChoices[0].text).toEqual("first threaded choice");
    expect(story.currentChoices[1].text).toEqual("second threaded choice");

    story.ChooseChoiceIndex(0);
    expect(story.Continue()).toEqual("first threaded choice\n");
    expect(story.canContinue).toBe(false);
  });
});
