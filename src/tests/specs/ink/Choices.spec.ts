import * as testsUtils from "../common";

describe("Choices", () => {
  let story: any;

  function loadStory(name: any) {
    story = testsUtils.loadInkFile(name, "choices");
  }

  beforeEach(() => {
    story = undefined;
  });

  it("tests choice count", () => {
    loadStory("choice_count");
    expect(story.Continue()).toBe("2\n");
  });

  it("tests choice divert to done", () => {
    loadStory("choice_diverts_to_done");
    story.Continue();

    expect(story.currentChoices.length).toBe(1);
    story.ChooseChoiceIndex(0);

    expect(story.Continue()).toBe("choice");
    expect(story.hasError).toBe(false);
  });

  it("tests choice with brackets only", () => {
    loadStory("choice_with_brackets_only");
    story.Continue();

    expect(story.currentChoices.length).toBe(1);
    expect(story.currentChoices[0].text).toBe("Option");
    story.ChooseChoiceIndex(0);

    expect(story.Continue()).toBe("Text\n");
  });

  it("tests choice thread forking", () => {
    loadStory("choice_thread_forking");
    story.Continue();
    let savedState = story.state.ToJson();

    loadStory("choice_thread_forking");
    story.state.LoadJson(savedState);

    story.ChooseChoiceIndex(0);
    story.ContinueMaximally();

    expect(story.hasWarning).toBe(false);
  });

  it("tests conditional choices", () => {
    loadStory("conditional_choices");
    story.ContinueMaximally();

    expect(story.currentChoices.length).toBe(4);
    expect(story.currentChoices[0].text).toBe("one");
    expect(story.currentChoices[1].text).toBe("two");
    expect(story.currentChoices[2].text).toBe("three");
    expect(story.currentChoices[3].text).toBe("four");
  });

  it("tests default choice", () => {
    loadStory("default_choices");

    expect(story.Continue()).toBe("");
    expect(story.currentChoices.length).toBe(2);

    story.ChooseChoiceIndex(0);
    expect(story.Continue()).toBe("After choice\n");

    expect(story.currentChoices.length).toBe(1);

    story.ChooseChoiceIndex(0);
    expect(story.ContinueMaximally()).toBe("After choice\nThis is default.\n");
  });

  it("tests default simple gather", () => {
    loadStory("default_simple_gather");

    expect(story.Continue()).toBe("x\n");
  });

  it("tests fallback choice on thread", () => {
    loadStory("fallback_choice_on_thread");

    expect(story.Continue()).toBe("Should be 1 not 0: 1.\n");
  });

  it("tests gather choice same line", () => {
    loadStory("gather_choice_same_line");

    story.Continue();
    expect(story.currentChoices[0].text).toBe("hello");

    story.ChooseChoiceIndex(0);
    story.Continue();

    expect(story.currentChoices[0].text).toBe("world");
  });

  it("tests has read on choice", () => {
    loadStory("has_read_on_choice");

    story.ContinueMaximally();
    expect(story.currentChoices.length).toBe(1);
    expect(story.currentChoices[0].text).toBe("visible choice");
  });

  it("tests logic in choices", () => {
    loadStory("logic_in_choices");

    story.ContinueMaximally();
    expect(story.currentChoices[0].text).toBe("'Hello Joe, your name is Joe.'");
    story.ChooseChoiceIndex(0);
    expect(story.ContinueMaximally()).toBe(
      "'Hello Joe,' I said, knowing full well that his name was Joe.\n"
    );
  });

  it("tests non text in choice inner content", () => {
    loadStory("non_text_in_choice_inner_content");

    story.Continue();
    story.ChooseChoiceIndex(0);

    expect(story.Continue()).toBe("option text. Conditional bit. Next.\n");
  });

  it("tests test once only choices can link back to self", () => {
    loadStory("once_only_choices_can_link_back_to_self");

    story.ContinueMaximally();

    expect(story.currentChoices.length).toBe(1);
    expect(story.currentChoices[0].text).toBe("First choice");

    story.ChooseChoiceIndex(0);
    story.ContinueMaximally();

    expect(story.currentChoices.length).toBe(1);
    expect(story.currentChoices[0].text).toBe("Second choice");

    story.ChooseChoiceIndex(0);
    story.ContinueMaximally();

    expect(story.hasError).toBe(false);
  });

  it("tests test once only choices with own content", () => {
    loadStory("once_only_choices_with_own_content");

    story.ContinueMaximally();

    expect(story.currentChoices.length).toBe(3);

    story.ChooseChoiceIndex(0);
    story.ContinueMaximally();

    expect(story.currentChoices.length).toBe(2);

    story.ChooseChoiceIndex(0);
    story.ContinueMaximally();

    expect(story.currentChoices.length).toBe(1);

    story.ChooseChoiceIndex(0);
    story.ContinueMaximally();

    expect(story.currentChoices.length).toBe(0);
  });

  it("tests should not gather due to choice", () => {
    loadStory("should_not_gather_due_to_choice");

    story.ContinueMaximally();
    story.ChooseChoiceIndex(0);

    expect(story.ContinueMaximally()).toBe("opt\ntext\n");
  });

  it("tests sticky choices stay sticky", () => {
    loadStory("sticky_choices_stay_sticky");

    story.ContinueMaximally();
    expect(story.currentChoices.length).toBe(2);

    story.ChooseChoiceIndex(0);
    story.ContinueMaximally();
    expect(story.currentChoices.length).toBe(2);
  });

  it("tests various default choices", () => {
    loadStory("various_default_choices");

    expect(story.ContinueMaximally()).toBe("1\n2\n3\n");
  });
});
