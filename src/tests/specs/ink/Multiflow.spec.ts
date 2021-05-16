import * as testsUtils from "../common";

describe("Multiflow", () => {
  let story: any;

  function loadStory(name: string) {
    story = testsUtils.loadInkFile(name, "multiflow");
  }

  beforeEach(() => {
    story = undefined;
  });

  it("tests multi flow basics", () => {
    loadStory("multi_flow_basics");

    story.SwitchFlow("First");
    story.ChoosePathString("knot1");
    expect(story.Continue()).toBe("knot 1 line 1\n");

    story.SwitchFlow("Second");
    story.ChoosePathString("knot2");
    expect(story.Continue()).toBe("knot 2 line 1\n");

    story.SwitchFlow("First");
    expect(story.Continue()).toBe("knot 1 line 2\n");

    story.SwitchFlow("Second");
    expect(story.Continue()).toBe("knot 2 line 2\n");
  });

  it("tests multi flow save load threads", () => {
    loadStory("multi_flow_save_load_threads");

    expect(story.Continue()).toBe("Default line 1\n");

    story.SwitchFlow("Blue Flow");
    story.ChoosePathString("blue");
    expect(story.Continue()).toBe("Hello I'm blue\n");

    story.SwitchFlow("Red Flow");
    story.ChoosePathString("red");
    expect(story.Continue()).toBe("Hello I'm red\n");

    story.SwitchFlow("Blue Flow");
    expect(story.currentText).toBe("Hello I'm blue\n");
    expect(story.currentChoices[0].text).toBe("Thread 1 blue choice");

    story.SwitchFlow("Red Flow");
    expect(story.currentText).toBe("Hello I'm red\n");
    expect(story.currentChoices[0].text).toBe("Thread 1 red choice");

    let saved = story.state.ToJson();

    story.ChooseChoiceIndex(0);
    expect(story.ContinueMaximally()).toBe(
      "Thread 1 red choice\nAfter thread 1 choice (red)\n"
    );
    story.ResetState();

    story.state.LoadJson(saved);

    story.ChooseChoiceIndex(1);
    expect(story.ContinueMaximally()).toBe(
      "Thread 2 red choice\nAfter thread 2 choice (red)\n"
    );

    story.state.LoadJson(saved);
    story.SwitchFlow("Blue Flow");
    story.ChooseChoiceIndex(0);
    expect(story.ContinueMaximally()).toBe(
      "Thread 1 blue choice\nAfter thread 1 choice (blue)\n"
    );

    story.state.LoadJson(saved);
    story.SwitchFlow("Blue Flow");
    story.ChooseChoiceIndex(1);
    expect(story.ContinueMaximally()).toBe(
      "Thread 2 blue choice\nAfter thread 2 choice (blue)\n"
    );

    story.RemoveFlow("Blue Flow");
    expect(story.Continue()).toBe("Default line 2\n");
  });
});
