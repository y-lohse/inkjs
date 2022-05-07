import { CommentEliminator } from "../../../compiler/Parser/CommentEliminator";
import { Path } from "../../../engine/Path";
import * as testsUtils from "../common";

describe("Misc", () => {
  let context: testsUtils.TestContext;

  function compileStory(
    name: string,
    countAllVisits: boolean = false,
    testingErrors: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "misc",
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

  // TestEmpty
  it("tests empty", () => {
    compileStory("empty");

    expect(context.story.ContinueMaximally()).toBe("");
  });

  // TestEndOfContent
  it("tests end of content", () => {
    compileStory("end_of_content_hello_world", false, true);
    context.story.ContinueMaximally();
    expect(context.errorMessages.length).toBe(0);

    compileStory("end_of_content_with_end");
    context.story.ContinueMaximally();

    compileStory("end_of_content_without_end", false, true);
    context.story.ContinueMaximally();
    expect(context.warningMessages.length).toBeGreaterThan(0);

    compileStoryWithoutRuntime("end_of_content_without_end");
    expect(context.errorMessages.length).toBe(0);
    expect(context.warningMessages.length).toBeGreaterThan(0);

    compileStoryWithoutRuntime("end_of_content_return_statement");
    expect(context.errorMessages).toContainStringContaining(
      "Return statements can only be used in knots that are declared as functions"
    );

    compileStoryWithoutRuntime("end_of_content_function");
    expect(context.errorMessages).toContainStringContaining(
      "Functions may not contain diverts"
    );
  });

  // TestEnd
  it("tests end", () => {
    compileStory("end");

    expect(context.story.ContinueMaximally()).toBe("hello\n");
  });

  // TestEnd2
  it("tests end 2", () => {
    compileStory("end2");

    expect(context.story.ContinueMaximally()).toBe("hello\n");
  });

  // TestEscapeCharacter
  it("tests escape characters", () => {
    compileStory("escape_character");

    expect(context.story.ContinueMaximally()).toBe("this is a '|' character\n");
  });

  // TestHelloWorld
  it("tests hello world", () => {
    compileStory("hello_world");

    expect(context.story.Continue()).toBe("Hello world\n");
  });

  // TestIdentifersCanStartWithNumbers
  it("tests identifiers can start with numbers", () => {
    compileStory("identifiers_can_start_with_number");

    expect(context.story.ContinueMaximally()).toBe(
      "512x2 = 1024\n512x2p2 = 1026\n"
    );
  });

  // TestInclude
  it("tests include", () => {
    compileStory("include");

    expect(context.story.ContinueMaximally()).toBe(
      "This is include 1.\nThis is include 2.\nThis is the main file.\n"
    );
  });

  // TestNestedInclude
  it("tests nested include", () => {
    compileStory("nested_include");

    expect(context.story.ContinueMaximally()).toBe(
      "The value of a variable in test file 2 is 5.\nThis is the main file\nThe value when accessed from knot_in_2 is 5.\n"
    );
  });

  // TestQuoteCharacterSignificance
  it("tests quote character significance", () => {
    compileStory("quote_character_significance");

    expect(context.story.ContinueMaximally()).toBe('My name is "Joe"\n');
  });

  // TestWhitespace
  it("tests whitespace", () => {
    compileStory("whitespace");

    expect(context.story.ContinueMaximally()).toBe("Hello!\nWorld.\n");
  });

  // TestPaths
  it("tests paths", () => {
    let path1 = new Path("hello.1.world");
    let path2 = new Path("hello.1.world");

    let path3 = new Path(".hello.1.world");
    let path4 = new Path(".hello.1.world");

    expect(path1.Equals(path2)).toBeTruthy();
    expect(path3.Equals(path4)).toBeTruthy();
    expect(path1.Equals(path3)).toBeFalsy();
  });

  // TestCommentEliminator
  it("tests comment eliminator", () => {
    let testContent = `A// C
A /* C */ A

A * A * /* * C *// A/*
C C C

*/`;

    let eliminator: CommentEliminator = new CommentEliminator(testContent);

    expect(eliminator.Process()).toBe("A\nA  A\n\nA * A * / A\n\n\n");
  });

  // TestCommentEliminatorMixedNewlines
  it("tests comment eliminator mixed newlines", () => {
    let testContent =
      "A B\nC D // comment\nA B\r\nC D // comment\r\n/* block comment\r\nsecond line\r\n */ ";

    let eliminator: CommentEliminator = new CommentEliminator(testContent);

    expect(eliminator.Process()).toBe("A B\nC D \nA B\nC D \n\n\n ");
  });

  // TestLooseEnds
  it("tests loose ends", () => {
    compileStoryWithoutRuntime("loose_ends");

    expect(context.warningMessages.length).toBe(3);
    expect(context.warningMessages).toContainStringContaining(
      "line 4: Apparent loose end"
    );
    expect(context.warningMessages).toContainStringContaining(
      "line 6: Apparent loose end"
    );
    expect(context.warningMessages).toContainStringContaining(
      "line 14: Apparent loose end"
    );
    expect(context.authorMessages.length).toBe(1);
  });

  // TestReturnTextWarning
  it("tests return text warning", () => {
    compileStoryWithoutRuntime("return_text_warning");
    expect(context.warningMessages.length).toBeGreaterThanOrEqual(1);
  });

  // TestAuthorWarningsInsideContentListBug
  it("tests author warnings inside content list bug", () => {
    compileStory("author_warnings_inside_content_list_bug", false, true);

    expect(context.errorMessages.length).toBe(0);
  });
});
