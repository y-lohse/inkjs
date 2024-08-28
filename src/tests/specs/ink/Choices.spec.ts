import * as testsUtils from "../common";

describe("Choices", () => {
  let context: testsUtils.TestContext;

  function compileStory(
    name: string,
    countAllVisits: boolean = false,
    testingErrors: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "choices",
      countAllVisits,
      testingErrors
    );
  }

  afterEach(() => {
    context = new testsUtils.TestContext();
  });

  // TestChoiceCount
  it("tests choice count", () => {
    compileStory("choice_count");
    expect(context.story.Continue()).toBe("2\n");
  });

  // TestChoiceDivertsToDone
  it("tests choice divert to done", () => {
    compileStory("choice_diverts_to_done");
    context.story.Continue();

    expect(context.story.currentChoices.length).toBe(1);
    context.story.ChooseChoiceIndex(0);

    expect(context.story.Continue()).toBe("choice");
  });

  // TestChoiceWithBracketsOnly
  it("tests choice with brackets only", () => {
    compileStory("choice_with_brackets_only");
    context.story.Continue();

    expect(context.story.currentChoices.length).toBe(1);
    expect(context.story.currentChoices[0].text).toBe("Option");
    context.story.ChooseChoiceIndex(0);

    expect(context.story.Continue()).toBe("Text\n");
  });

  // TestChoiceThreadForking
  it("tests choice thread forking", () => {
    compileStory("choice_thread_forking");
    context.story.Continue();
    let savedState = context.story.state.ToJson();

    compileStory("choice_thread_forking");
    context.story.state.LoadJson(savedState);

    context.story.ChooseChoiceIndex(0);
    context.story.ContinueMaximally();

    expect(context.story.hasWarning).toBe(false);
  });

  // TestConditionalChoices
  it("tests conditional choices", () => {
    compileStory("conditional_choices");
    context.story.ContinueMaximally();

    expect(context.story.currentChoices.length).toBe(4);
    expect(context.story.currentChoices[0].text).toBe("one");
    expect(context.story.currentChoices[1].text).toBe("two");
    expect(context.story.currentChoices[2].text).toBe("three");
    expect(context.story.currentChoices[3].text).toBe("four");
  });

  // TestDefaultChoices
  it("tests default choice", () => {
    compileStory("default_choices");

    expect(context.story.Continue()).toBe("");
    expect(context.story.currentChoices.length).toBe(2);

    context.story.ChooseChoiceIndex(0);
    expect(context.story.Continue()).toBe("After choice\n");

    expect(context.story.currentChoices.length).toBe(1);

    context.story.ChooseChoiceIndex(0);
    expect(context.story.ContinueMaximally()).toBe(
      "After choice\nThis is default.\n"
    );
  });

  // TestDefaultSimpleGather
  it("tests default simple gather", () => {
    compileStory("default_simple_gather");

    expect(context.story.Continue()).toBe("x\n");
  });

  // TestFallbackChoiceOnThread
  it("tests fallback choice on thread", () => {
    compileStory("fallback_choice_on_thread");

    expect(context.story.Continue()).toBe("Should be 1 not 0: 1.\n");
  });

  // TestGatherChoiceSameLine
  it("tests gather choice same line", () => {
    compileStory("gather_choice_same_line");

    context.story.Continue();
    expect(context.story.currentChoices[0].text).toBe("hello");

    context.story.ChooseChoiceIndex(0);
    context.story.Continue();

    expect(context.story.currentChoices[0].text).toBe("world");
  });

  // TestHasReadOnChoice
  it("tests has read on choice", () => {
    compileStory("has_read_on_choice");

    context.story.ContinueMaximally();
    expect(context.story.currentChoices.length).toBe(1);
    expect(context.story.currentChoices[0].text).toBe("visible choice");
  });

  // TestLogicInChoices
  it("tests logic in choices", () => {
    compileStory("logic_in_choices");

    context.story.ContinueMaximally();
    expect(context.story.currentChoices[0].text).toBe(
      "'Hello Joe, your name is Joe.'"
    );
    context.story.ChooseChoiceIndex(0);
    expect(context.story.ContinueMaximally()).toBe(
      "'Hello Joe,' I said, knowing full well that his name was Joe.\n"
    );
  });

  // TestNonTextInChoiceInnerContent
  it("tests non text in choice inner content", () => {
    compileStory("non_text_in_choice_inner_content");

    context.story.Continue();
    context.story.ChooseChoiceIndex(0);

    expect(context.story.Continue()).toBe(
      "option text. Conditional bit. Next.\n"
    );
  });

  // TestOnceOnlyChoicesCanLinkBackToSelf
  it("tests test once only choices can link back to self", () => {
    compileStory("once_only_choices_can_link_back_to_self");

    context.story.ContinueMaximally();

    expect(context.story.currentChoices.length).toBe(1);
    expect(context.story.currentChoices[0].text).toBe("First choice");

    context.story.ChooseChoiceIndex(0);
    context.story.ContinueMaximally();

    expect(context.story.currentChoices.length).toBe(1);
    expect(context.story.currentChoices[0].text).toBe("Second choice");

    context.story.ChooseChoiceIndex(0);
    context.story.ContinueMaximally();

    expect(context.story.hasError).toBe(false);
  });

  // TestOnceOnlyChoicesWithOwnContent
  it("tests test once only choices with own content", () => {
    compileStory("once_only_choices_with_own_content");

    context.story.ContinueMaximally();

    expect(context.story.currentChoices.length).toBe(3);

    context.story.ChooseChoiceIndex(0);
    context.story.ContinueMaximally();

    expect(context.story.currentChoices.length).toBe(2);

    context.story.ChooseChoiceIndex(0);
    context.story.ContinueMaximally();

    expect(context.story.currentChoices.length).toBe(1);

    context.story.ChooseChoiceIndex(0);
    context.story.ContinueMaximally();

    expect(context.story.currentChoices.length).toBe(0);
  });

  // TestShouldntGatherDueToChoice
  it("tests should not gather due to choice", () => {
    compileStory("should_not_gather_due_to_choice");

    context.story.ContinueMaximally();
    context.story.ChooseChoiceIndex(0);

    expect(context.story.ContinueMaximally()).toBe("opt\ntext\n");
  });

  // TestStickyChoicesStaySticky
  it("tests sticky choices stay sticky", () => {
    compileStory("sticky_choices_stay_sticky");

    context.story.ContinueMaximally();
    expect(context.story.currentChoices.length).toBe(2);

    context.story.ChooseChoiceIndex(0);
    context.story.ContinueMaximally();
    expect(context.story.currentChoices.length).toBe(2);
  });

  // TestVariousDefaultChoices
  it("tests various default choices", () => {
    compileStory("various_default_choices");

    expect(context.story.ContinueMaximally()).toBe("1\n2\n3\n");
  });

  // TestStateRollbackOverDefaultChoice
  it("tests state rollback over default choice", () => {
    compileStory("state_rollback_over_default_choice");

    expect(context.story.Continue()).toBe("Text.\n");
    expect(context.story.Continue()).toBe("5\n");
  });

  // TestNestedChoiceError
  it("tests nested choice error", () => {
    compileStory("nested_choice_error", false, true);

    expect(context.errorMessages).toContainStringContaining(
      "need to explicitly divert"
    );
  });

  // TestEmptyChoice
  it("tests empty choice", () => {
    compileStory("empty_choice", false, true);

    expect(context.errorMessages.length).toBe(0);
    expect(context.warningMessages.length).toBe(1);
    expect(context.warningMessages).toContainStringContaining(
      "completely empty"
    );
  });

  // TestVariousBlankChoiceWarning
  it("tests various blank choice warning", () => {
    compileStory("various_blank_choice_warning", false, true);

    expect(context.warningMessages).toContainStringContaining("Blank choice");
  });

  //TestTagsInChoice
  it("tests tags in choice", () => {
    compileStory("tags_in_choice", true);
    context.story.Continue();

    expect(context.story.currentTags.length).toBe(0);
    expect(context.story.currentChoices.length).toBe(1);
    expect(context.story.currentChoices[0].tags).toEqual(["one", "two"]);

    context.story.ChooseChoiceIndex(0);
    expect(context.story.Continue()).toBe("one three");
    expect(context.story.currentTags).toEqual(["one", "three"]);
  });

  //TestDynanicTagsInChoice
  it("tests tags in choice", () => {
    compileStory("dynamic_tags_in_choice", true);
    context.story.Continue();

    expect(context.story.currentTags.length).toBe(0);
    expect(context.story.currentChoices.length).toBe(1);
    expect(context.story.currentChoices[0].text).toEqual("choice");
    expect(context.story.currentChoices[0].tags).toEqual(["tag aaabbb"]);
  });

  it("tests newline after choice name", () => {
    compileStory("newline_after_choice", true);
    context.story.Continue();

    expect(context.story.currentChoices.length).toBe(1);
    expect(context.story.currentChoices[0].text).toEqual(
      "I did have one interesting fact about bricklaying, if you don't mind me spending taking a fair bit of time to lay the groundwork for it."
    );
  });
});
