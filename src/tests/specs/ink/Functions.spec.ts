import * as testsUtils from "../common";

describe("Functions", () => {
  let context: testsUtils.TestContext;

  function compileStoryWithoutRuntime(
    name: string,
    countAllVisits: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "functions/compiler",
      countAllVisits,
      true
    );
  }

  afterEach(() => {
    context = new testsUtils.TestContext();
  });

  // TestArgumentNameCollisions
  it("tests argument name collision", () => {
    compileStoryWithoutRuntime("argument_name_collisions");

    expect(context.errorMessages.length).toBe(2);
    expect(context.errorMessages).toContainStringContaining(
      "name has already been used for a function"
    );
    expect(context.errorMessages).toContainStringContaining(
      "name has already been used for a var"
    );
  });

  // TestArgumentShouldntConflictWithGatherElsewhere
  it("tests argument shouldn't conflict with gather elsewhere", () => {
    compileStoryWithoutRuntime(
      "argument_shouldnt_conflict_with_gather_elsewhere"
    );

    expect(context.errorMessages.length).toBe(0);
  });

  // TestFunctionCallRestrictions
  it("tests function call restrictions", () => {
    compileStoryWithoutRuntime("function_call_restrictions");

    expect(context.errorMessages.length).toBe(2);
    expect(context.errorMessages[0]).toContain(
      "hasn't been marked as a function"
    );
    expect(context.errorMessages[1]).toContain(
      "can only be called as a function"
    );
  });

  // TestFunctionPurityChecks
  it("tests function purity checks", () => {
    compileStoryWithoutRuntime("function_purity_checks");

    expect(context.errorMessages.length).toBe(7);
    expect(context.errorMessages[0]).toContain(
      "Return statements can only be used in knots that"
    );
    expect(context.errorMessages[1]).toContain("Functions cannot be stitches");
    expect(context.errorMessages[2]).toContain(
      "Functions may not contain stitches"
    );
    expect(context.errorMessages[3]).toContain(
      "Functions may not contain diverts"
    );
    expect(context.errorMessages[4]).toContain(
      "Functions may not contain choices"
    );
    expect(context.errorMessages[5]).toContain(
      "Functions may not contain choices"
    );
    expect(context.errorMessages[6]).toContain(
      "Return statements can only be used in knots that"
    );
  });

  // TestWrongVariableDivertTargetReference
  it("tests wrong variable divert target reference", () => {
    compileStoryWithoutRuntime("wrong_variable_divert_target_reference");

    expect(context.errorMessages).toContainStringContaining(
      "it shouldn't be preceded by '->'"
    );
  });

  // TestUsingFunctionAndIncrementTogether
  it("tests using function and increment together", () => {
    compileStoryWithoutRuntime("using_function_and_increment_together");

    expect(context.errorMessages.length).toBe(0);
    expect(context.warningMessages.length).toBe(0);
  });
});
