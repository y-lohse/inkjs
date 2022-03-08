import * as testsUtils from "../common";

describe("Variables", () => {
  let context: testsUtils.TestContext;

  function compileStory(
    name: string,
    countAllVisits: boolean = false,
    testingErrors: boolean = false
  ) {
    context = testsUtils.makeDefaultTestContext(
      name,
      "variables",
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
      "variables/compiler",
      countAllVisits,
      true
    );
  }

  afterEach(() => {
    context = new testsUtils.TestContext();
  });

  // TestConst
  it("tests const", () => {
    compileStory("const");

    expect(context.story.Continue()).toBe("5\n");
  });

  // TestMultipleConstantReferences
  it("tests multiple constant references", () => {
    compileStory("multiple_constant_references");

    expect(context.story.Continue()).toBe("success\n");
  });

  // TestSetNonExistantVariable (sic – do not fix the typo)
  it("tests set non existent variable", () => {
    compileStory("set_non_existent_variable");

    expect(context.story.Continue()).toBe("Hello world.\n");

    expect(() => {
      context.story.variablesState["y"] = "earth";
    }).toThrow();
  });

  // TestTempGlobalConflict
  it("tests temp global conflict", () => {
    compileStory("temp_global_conflict");

    expect(context.story.Continue()).toBe("0\n");
  });

  // TestTempNotFound
  it("tests temp not found", () => {
    // TODO: refactor error handling, see upstream.
    compileStory("temp_not_found", false, true);

    expect(() => {
      expect(context.story.ContinueMaximally()).toBe("0\nhello\n");
    }).toThrow();

    expect(context.story.hasWarning).toBe(true);
  });

  // TestTempUsageInOptions
  it("tests temp usage in options", () => {
    compileStory("temp_usage_in_options");

    context.story.Continue();

    expect(context.story.currentChoices.length).toBe(1);
    expect(context.story.currentChoices[0].text).toBe("1");

    context.story.ChooseChoiceIndex(0);
    expect(context.story.ContinueMaximally()).toBe(
      "1\nEnd of choice\nthis another\n"
    );
    expect(context.story.currentChoices.length).toBe(0);
  });

  // TestTemporariesAtGlobalScope
  it("tests temporaries at global scope", () => {
    compileStory("temporaries_at_global_scope");

    expect(context.story.Continue()).toBe("54\n");
  });

  // TestVariableDeclarationInConditional
  it("tests variable declaration in conditional", () => {
    compileStory("variable_declaration_in_conditional");

    expect(context.story.Continue()).toBe("5\n");
  });

  // TestVariableDivertTarget
  it("tests variable declaration in conditional", () => {
    compileStory("variable_divert_target");

    expect(context.story.Continue()).toBe("Here.\n");
  });

  // TestVariableGetSetAPI
  it("tests variable get set api", () => {
    compileStory("variable_get_set_api");

    expect(context.story.ContinueMaximally()).toBe("5\n");
    expect(context.story.variablesState["x"]).toBe(5);

    context.story.variablesState["x"] = 10;
    context.story.ChooseChoiceIndex(0);
    expect(context.story.ContinueMaximally()).toBe("10\n");
    expect(context.story.variablesState["x"]).toBe(10);

    context.story.variablesState["x"] = 8.5;
    context.story.ChooseChoiceIndex(0);
    expect(context.story.ContinueMaximally()).toBe("8.5\n");
    expect(context.story.variablesState["x"]).toBe(8.5);

    context.story.variablesState["x"] = "a string";
    context.story.ChooseChoiceIndex(0);
    expect(context.story.ContinueMaximally()).toBe("a string\n");
    expect(context.story.variablesState["x"]).toBe("a string");

    expect(context.story.variablesState["z"]).toBe(null);

    expect(() => {
      // Arbitrary type. Note that [] gets converted to 0, which may not
      // be what we want.
      context.story.variablesState["x"] = new Map();
    }).toThrow();
  });

  // TestVariablePointerRefFromKnot
  it("tests variable pointer ref from knot", () => {
    compileStory("variable_pointer_ref_from_knot");

    expect(context.story.Continue()).toBe("6\n");
  });

  // TestVariableSwapRecurse
  it("tests variable swap recurse", () => {
    compileStory("variable_swap_recurse");

    expect(context.story.ContinueMaximally()).toBe("1 2\n");
  });

  // TestVariableTunnel
  it("tests variable pointer ref from knot", () => {
    compileStory("variable_tunnel");

    expect(context.story.ContinueMaximally()).toBe("STUFF\n");
  });

  // TestRequireVariableTargetsTyped
  it("tests require variable targets typed", () => {
    compileStoryWithoutRuntime("require_variable_targets_typed");

    expect(context.errorMessages).toContainStringContaining(
      "it should be marked as: ->"
    );
  });

  // TestConstRedefinition
  it("tests const redefinition", () => {
    compileStoryWithoutRuntime("const_redefinition");
    expect(context.errorMessages).not.toContainStringContaining(
      "'pi' has been redefined"
    );
    expect(context.errorMessages).toContainStringContaining(
      "'x' has been redefined"
    );
    expect(context.errorMessages).toContainStringContaining(
      "'y' has been redefined"
    );
    expect(context.errorMessages).toContainStringContaining(
      "'z' has been redefined"
    );
  });

  // TestVariableNamingCollisionWithFlow
  it("tests variable naming collision with flow", () => {
    // The Original code used 'CompileString', but since the compilation fails,
    // 'compile' can be used instead.
    compileStoryWithoutRuntime("variable_naming_collision_with_flow");

    expect(context.errorMessages).toContainStringContaining(
      "name has already been used for a function"
    );
  });

  // TestVariableNamingCollisionWithArg
  it("tests variable naming collision with arg", () => {
    // The Original code used 'CompileString', but since the compilation fails,
    // 'compile' can be used instead.
    compileStoryWithoutRuntime("variable_naming_collision_with_arg");
    expect(context.errorMessages).toContainStringContaining(
      "name has already been used for a argument to knot"
    );
  });

  // TestTempNotAllowedCrossStitch
  it("tests temp not allowed cross stitch", () => {
    // The Original code used 'CompileString', but since the compilation fails,
    // 'compile' can be used instead.
    compileStoryWithoutRuntime("temp_not_allowed_cross_stitch");

    expect(context.errorMessages).toContainStringContaining(
      "Unresolved variable: x"
    );

    expect(context.errorMessages).toContainStringContaining(
      "Unresolved variable: y"
    );
  });
});
