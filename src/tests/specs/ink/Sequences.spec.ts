import * as testsUtils from "../common";

describe("Sequences", () => {
  let context: testsUtils.TestContext;

  function compileStory(
    name: string,
    countAllVisits: boolean = false,
    testingErrors: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "sequences",
      countAllVisits,
      testingErrors
    );
  }

  afterEach(() => {
    context = new testsUtils.TestContext();
  });

  // TestBlanksInInlineSequences
  it("tests blanks in inline sequences", () => {
    compileStory("blanks_in_inline_sequences");
    expect(context.story.ContinueMaximally()).toBe(
      "1. a\n2.\n3. b\n4. b\n---\n1.\n2. a\n3. a\n---\n1. a\n2.\n3.\n---\n1.\n2.\n3.\n"
    );
  });

  // TestEmptySequenceContent
  it("tests empty sequence content", () => {
    compileStory("empty_sequence_content");
    expect(context.story.ContinueMaximally()).toBe(
      "Wait for it....\nSurprise!\nDone.\n"
    );
  });

  // TestGatherReadCountWithInitialSequence
  it("tests gather read count with initial sequence", () => {
    compileStory("gather_read_count_with_initial_sequence");
    expect(context.story.Continue()).toBe("seen test\n");
  });

  // TestLeadingNewlineMultilineSequence
  it("tests leading newline multiline sequence", () => {
    compileStory("leading_newline_multiline_sequence");
    expect(context.story.Continue()).toBe("a line after an empty line\n");
  });

  // TestShuffleStackMuddying
  it("tests shuffle stack muddying", () => {
    compileStory("shuffle_stack_muddying");

    context.story.Continue();

    expect(context.story.currentChoices.length).toBe(2);
  });

  // TestAllSequenceTypes
  it("tests all sequence type", () => {
    compileStory("all_sequence_types");

    expect(context.story.ContinueMaximally()).toBe(
      "Once: one two\nStopping: one two two two\nDefault: one two two two\nCycle: one two one two\nShuffle: two one one two\nShuffle stopping: one two final final\nShuffle once: two one\n"
    );
  });
});
