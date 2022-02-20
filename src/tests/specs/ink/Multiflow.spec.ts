import * as testsUtils from "../common";

describe("Multiflow", () => {
  let context: testsUtils.TestContext;

  function compileStory(
    name: string,
    countAllVisits: boolean = false,
    testingErrors: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "multiflow",
      countAllVisits,
      testingErrors
    );
  }

  afterEach(() => {
    context = new testsUtils.TestContext();
  });

  // TestMultiFlowBasics
  it("tests multi flow basics", () => {
    compileStory("multi_flow_basics");

    context.story.SwitchFlow("First");
    context.story.ChoosePathString("knot1");
    expect(context.story.Continue()).toBe("knot 1 line 1\n");

    context.story.SwitchFlow("Second");
    context.story.ChoosePathString("knot2");
    expect(context.story.Continue()).toBe("knot 2 line 1\n");

    context.story.SwitchFlow("First");
    expect(context.story.Continue()).toBe("knot 1 line 2\n");

    context.story.SwitchFlow("Second");
    expect(context.story.Continue()).toBe("knot 2 line 2\n");
  });

  // TestMultiFlowSaveLoadThreads
  it("tests multi flow save load threads", () => {
    compileStory("multi_flow_save_load_threads");

    expect(context.story.Continue()).toBe("Default line 1\n");

    context.story.SwitchFlow("Blue Flow");
    context.story.ChoosePathString("blue");
    expect(context.story.Continue()).toBe("Hello I'm blue\n");

    context.story.SwitchFlow("Red Flow");
    context.story.ChoosePathString("red");
    expect(context.story.Continue()).toBe("Hello I'm red\n");

    context.story.SwitchFlow("Blue Flow");
    expect(context.story.currentText).toBe("Hello I'm blue\n");
    expect(context.story.currentChoices[0].text).toBe("Thread 1 blue choice");

    context.story.SwitchFlow("Red Flow");
    expect(context.story.currentText).toBe("Hello I'm red\n");
    expect(context.story.currentChoices[0].text).toBe("Thread 1 red choice");

    let saved = context.story.state.ToJson();

    context.story.ChooseChoiceIndex(0);
    expect(context.story.ContinueMaximally()).toBe(
      "Thread 1 red choice\nAfter thread 1 choice (red)\n"
    );
    context.story.ResetState();

    context.story.state.LoadJson(saved);

    context.story.ChooseChoiceIndex(1);
    expect(context.story.ContinueMaximally()).toBe(
      "Thread 2 red choice\nAfter thread 2 choice (red)\n"
    );

    context.story.state.LoadJson(saved);
    context.story.SwitchFlow("Blue Flow");
    context.story.ChooseChoiceIndex(0);
    expect(context.story.ContinueMaximally()).toBe(
      "Thread 1 blue choice\nAfter thread 1 choice (blue)\n"
    );

    context.story.state.LoadJson(saved);
    context.story.SwitchFlow("Blue Flow");
    context.story.ChooseChoiceIndex(1);
    expect(context.story.ContinueMaximally()).toBe(
      "Thread 2 blue choice\nAfter thread 2 choice (blue)\n"
    );

    context.story.RemoveFlow("Blue Flow");
    expect(context.story.Continue()).toBe("Default line 2\n");
  });
});
