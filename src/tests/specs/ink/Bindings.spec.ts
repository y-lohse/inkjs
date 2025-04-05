import * as testsUtils from "../common";

describe("Bindings", () => {
  let context: testsUtils.TestContext;

  function compileStory(
    name: string,
    countAllVisits: boolean = false,
    testingErrors: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "bindings",
      countAllVisits,
      testingErrors
    );
  }

  afterEach(() => {
    context = new testsUtils.TestContext();
  });

  // TestExternalBinding
  it("tests external bindings", () => {
    compileStory("external_binding");

    let testExternalBindingMessage = "";

    context.story.BindExternalFunction("message", (arg: any) => {
      testExternalBindingMessage = "MESSAGE: " + arg;
    });

    context.story.BindExternalFunction("multiply", (arg1: any, arg2: any) => {
      return arg1 * arg2;
    });

    context.story.BindExternalFunction(
      "times",
      (numberOfTimes: any, stringValue: any) => {
        let result = "";

        for (let i = 0; i < numberOfTimes; i++) {
          result += stringValue;
        }

        return result;
      }
    );

    expect(context.story.Continue()).toBe("15\n");
    expect(context.story.Continue()).toBe("knock knock knock\n");
    expect(testExternalBindingMessage).toBe("MESSAGE: hello world");
  });

  // TestGameInkBackAndForth
  it("tests game ink back and forth", () => {
    compileStory("game_ink_back_and_forth");

    context.story.BindExternalFunction("gameInc", (x: any) => {
      x += 1;
      x = context.story.EvaluateFunction("inkInc", [x]);
      return x;
    });

    let finalResult = context.story.EvaluateFunction("topExternal", [5], true);

    expect(finalResult["returned"]).toBe(7);
    expect(finalResult["output"]).toBe("In top external\n");
  });

  // TestVariableObserver
  it("tests variable observer", () => {
    compileStory("variable_observer");

    let currentVarValue = 0;
    let observerCallCount = 0;

    context.story.ObserveVariable("testVar", (varName: any, newValue: any) => {
      currentVarValue = newValue;
      observerCallCount += 1;
    });

    context.story.ContinueMaximally();

    expect(currentVarValue).toBe(15);
    expect(observerCallCount).toBe(1);

    context.story.ChooseChoiceIndex(0);
    context.story.Continue();

    expect(currentVarValue).toBe(25);
    expect(observerCallCount).toBe(2);
  });

  // TestLookupSafeOrNot
  it("tests lookup safe or not", () => {
    // SAFE Lookahead
    compileStory("lookup_safe_or_not");

    // Lookahead SAFE - should get multiple calls to the ext function,
    // one for lookahead on first line, one "for real" on second line.
    let callCount = 0;
    context.story.BindExternalFunction(
      "myAction",
      () => {
        callCount++;
      },
      true
    );

    context.story.ContinueMaximally();
    expect(callCount).toBe(2);

    // Lookahead UNSAFE - when it sees the function, it should break out early
    // and stop lookahead, making sure that the action is only called for the second line.
    callCount = 0;
    context.story.ResetState();
    context.story.UnbindExternalFunction("myAction");
    context.story.BindExternalFunction(
      "myAction",
      () => {
        callCount++;
      },
      false
    );

    context.story.ContinueMaximally();
    expect(callCount).toBe(1);

    // SAFE Lookahead with glue broken intentionally
    compileStory("lookup_safe_or_not_with_post_glue");

    // Disabling this rule to match the tests from upstream.
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    context.story.BindExternalFunction("myAction", () => {});
    expect(context.story.ContinueMaximally()).toBe("One\nTwo\n");
  });

  it("is possible to list all GlobalVariables using Object.keys", () => {
    compileStory("variable_observer");

    expect(Object.keys(context.story.variablesState)).toStrictEqual([
      "testVar",
      "testVar2",
    ]);
  });
});
