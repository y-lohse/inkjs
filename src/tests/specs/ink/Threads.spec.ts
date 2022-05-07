import * as testsUtils from "../common";

describe("Threads", () => {
  let context: testsUtils.TestContext;

  function compileStory(
    name: string,
    countAllVisits: boolean = false,
    testingErrors: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "threads",
      countAllVisits,
      testingErrors
    );
  }

  function compileStoryWithoutRuntime(
    name: string,
    countAllVisits: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "misc/compiler",
      countAllVisits,
      true
    );
  }

  afterEach(() => {
    context = new testsUtils.TestContext();
  });

  // TestMultiThread
  it("tests multi threads", () => {
    compileStory("multi_thread");

    expect(context.story.ContinueMaximally()).toBe(
      "This is place 1.\nThis is place 2.\n"
    );

    context.story.ChooseChoiceIndex(0);
    expect(context.story.ContinueMaximally()).toBe(
      "choice in place 1\nThe end\n"
    );
  });

  // TestThreadDone
  it("tests thread done", () => {
    compileStory("thread_done");

    expect(context.story.ContinueMaximally()).toBe(
      "This is a thread example\nHello.\nThe example is now complete.\n"
    );
  });

  // TestThreadInLogic
  it("tests thread in logic", () => {
    compileStory("thread_in_logic");

    expect(context.story.Continue()).toBe("Content\n");
  });

  // TestTopFlowTerminatorShouldntKillThreadChoices
  it("tests top flow terminator should not kill thread choices", () => {
    compileStory("top_flow_terminator_should_not_kill_thread_choices");

    expect(context.story.Continue()).toBe("Limes\n");
    expect(context.story.currentChoices.length).toBe(1);
  });

  // TestEmptyThreadError
  it("tests empty thread error", () => {
    compileStoryWithoutRuntime("empty_thread_error");

    expect(context.errorMessages).toContainStringContaining(
      "Expected target for new thread"
    );
  });
});
