import * as testsUtils from "../common";

describe("Evaluation", () => {
  let context: testsUtils.TestContext;

  function compileStory(
    name: string,
    countAllVisits: boolean = false,
    testingErrors: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "evaluation",
      countAllVisits,
      testingErrors
    );
  }

  afterEach(() => {
    context = new testsUtils.TestContext();
  });

  // TestArithmetic
  it("tests arithmetic with compilation", () => {
    compileStory("arithmetic");
    expect(context.story.ContinueMaximally()).toBe(
      "36\n2\n3\n2\n2.3333333333333335\n8\n8\n"
    );
  });

  it("tests arithmetic with story loaded from JSON", () => {
    context = testsUtils.fromJsonTestContext("arithmetic", "evaluation", false);
    expect(context.story.ContinueMaximally()).toBe(
      "36\n2\n3\n2\n2.3333333333333335\n8\n8\n"
    );
  });

  // TestBasicStringLiterals
  it("tests basic string literal", () => {
    compileStory("basic_string_literals");

    expect(context.story.ContinueMaximally()).toBe(
      "Hello world 1\nHello world 2.\n"
    );
  });

  // TestEvaluatingFunctionVariableStateBug
  it("tests evaluating function variable state bug", () => {
    compileStory("evaluating_function_variable_state_bug");

    expect(context.story.Continue()).toBe("Start\n");
    expect(context.story.Continue()).toBe("In tunnel.\n");

    let funcResult = context.story.EvaluateFunction("function_to_evaluate");
    expect(funcResult).toBe("RIGHT");
    expect(context.story.Continue()).toBe("End\n");
  });

  // TestEvaluatingInkFunctionsFromGame
  it("tests evaluating ink functions from game", () => {
    compileStory("evaluating_ink_functions_from_game");

    context.story.Continue();

    let returnedDivertTarget = context.story.EvaluateFunction("test");

    expect(returnedDivertTarget).toBe("-> somewhere.here");
  });

  // TestEvaluatingInkFunctionsFromGame2
  it("tests evaluating ink functions from game 2", () => {
    compileStory("evaluating_ink_functions_from_game_2");

    let funcResult = context.story.EvaluateFunction("func1", [], true);

    expect(funcResult["output"]).toBe("This is a function\n");
    expect(funcResult["returned"]).toBe(5);

    expect(context.story.Continue()).toBe("One\n");

    funcResult = context.story.EvaluateFunction("func2", [], true);

    expect(funcResult["output"]).toBe(
      "This is a function without a return value\n"
    );
    expect(funcResult["returned"]).toBe(null);

    expect(context.story.Continue()).toBe("Two\n");

    funcResult = context.story.EvaluateFunction("add", [1, 2], true);

    expect(funcResult["output"]).toBe("x = 1, y = 2\n");
    expect(funcResult["returned"]).toBe(3);

    expect(context.story.Continue()).toBe("Three\n");
  });

  // TestEvaluationStackLeaks
  it("tests evaluating stack leaks", () => {
    compileStory("evaluation_stack_leaks");

    expect(context.story.ContinueMaximally()).toBe("else\nelse\nhi\n");
    expect(context.story.state.evaluationStack.length).toBe(0);
  });

  // TestFactorialByReference
  it("tests factorial by reference", () => {
    compileStory("factorial_by_reference");

    expect(context.story.ContinueMaximally()).toBe("120\n");
  });

  // TestFactorialRecursive
  it("tests factorial recursive", () => {
    compileStory("factorial_recursive");

    expect(context.story.ContinueMaximally()).toBe("120\n");
  });

  // TestIncrement
  it("tests increment", () => {
    compileStory("increment");

    expect(context.story.ContinueMaximally()).toBe("6\n5\n");
  });

  // TestLiteralUnary
  it("tests literal unary", () => {
    compileStory("literal_unary");

    expect(context.story.ContinueMaximally()).toBe("-1\nfalse\ntrue\n");
  });
});
