import * as testsUtils from "../common";

describe("Evaluation", () => {
  let story: any;

  function loadStory(name: any) {
    story = testsUtils.loadInkFile(name, "evaluation");
  }

  beforeEach(() => {
    story = undefined;
  });

  it("tests arithmetic", () => {
    loadStory("arithmetic");
    expect(story.ContinueMaximally()).toBe("36\n2\n3\n2\n2\n8\n8\n");
  });

  it("tests basic string literal", () => {
    loadStory("basic_string_literals");

    expect(story.ContinueMaximally()).toBe("Hello world 1\nHello world 2.\n");
  });

  it("tests evaluating function variable state bug", () => {
    loadStory("evaluating_function_variable_state_bug");

    expect(story.Continue()).toBe("Start\n");
    expect(story.Continue()).toBe("In tunnel.\n");

    let funcResult = story.EvaluateFunction("function_to_evaluate");
    expect(funcResult).toBe("RIGHT");
    expect(story.Continue()).toBe("End\n");
  });

  it("tests evaluating ink functions from game", () => {
    loadStory("evaluating_ink_functions_from_game");

    story.Continue();

    let returnedDivertTarget = story.EvaluateFunction("test");

    expect(returnedDivertTarget).toBe("somewhere.here");
  });

  it("tests evaluating ink functions from game 2", () => {
    loadStory("evaluating_ink_functions_from_game_2");

    let funcResult = story.EvaluateFunction("func1", [], true);

    expect(funcResult["output"]).toBe("This is a function\n");
    expect(funcResult["returned"]).toBe(5);

    expect(story.Continue()).toBe("One\n");

    funcResult = story.EvaluateFunction("func2", [], true);

    expect(funcResult["output"]).toBe(
      "This is a function without a return value\n"
    );
    expect(funcResult["returned"]).toBe(null);

    expect(story.Continue()).toBe("Two\n");

    funcResult = story.EvaluateFunction("add", [1, 2], true);

    expect(funcResult["output"]).toBe("x = 1, y = 2\n");
    expect(funcResult["returned"]).toBe(3);

    expect(story.Continue()).toBe("Three\n");
  });

  it("tests evaluating stack leaks", () => {
    loadStory("evaluation_stack_leaks");

    expect(story.ContinueMaximally()).toBe("else\nelse\nhi\n");
    expect(story.state.evaluationStack.length).toBe(0);
  });

  it("tests factorial by reference", () => {
    loadStory("factorial_by_reference");

    expect(story.ContinueMaximally()).toBe("120\n");
  });

  it("tests factorial recursive", () => {
    loadStory("factorial_recursive");

    expect(story.ContinueMaximally()).toBe("120\n");
  });

  it("tests increment", () => {
    loadStory("increment");

    expect(story.ContinueMaximally()).toBe("6\n5\n");
  });

  it("tests literal unary", () => {
    loadStory("literal_unary");

    expect(story.ContinueMaximally()).toBe("-1\nfalse\ntrue\n");
  });
});
