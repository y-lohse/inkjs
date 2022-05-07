import * as testsUtils from "../../common";

describe("Logic", () => {
  let context: testsUtils.TestContext;

  beforeEach(() => {
    context = testsUtils.makeDefaultTestContext("tests", "inkjs", true);
    context.story.allowExternalFunctionFallbacks = true;
  });

  it("should define variables", () => {
    context.story.ChoosePathString("logic.vardef");

    expect(context.story.Continue()).toEqual(
      "variables defined: Emilia 521 52.1\n"
    );
  });

  it("should cast variables", () => {
    context.story.ChoosePathString("logic.casts");
    expect(context.story.Continue()).toEqual("521.5\n");
    expect(context.story.Continue()).toEqual("521hello\n");
    expect(context.story.Continue()).toEqual("float var is truthy\n");
    expect(context.story.Continue()).toEqual("52.1hello\n");
    expect(context.story.Continue()).toEqual("string var is truthy\n");
  });

  it("should perform mathematical operations", () => {
    context.story.ChoosePathString("logic.math");

    expect(context.story.Continue()).toEqual("2\n");
    expect(context.story.Continue()).toEqual("0\n");
    expect(context.story.Continue()).toEqual("-5\n");
    expect(context.story.Continue()).toEqual("2\n");
    expect(context.story.Continue()).toEqual("5\n");
    expect(context.story.Continue()).toEqual("1\n");

    expect(context.story.Continue()).toEqual("int truthy equal\n");
    expect(context.story.Continue()).toEqual("int falsy equal\n");

    expect(context.story.Continue()).toEqual("int truthy greater\n");
    expect(context.story.Continue()).toEqual("int falsy greater\n");

    expect(context.story.Continue()).toEqual("int truthy lesser\n");
    expect(context.story.Continue()).toEqual("int falsy lesser\n");

    expect(context.story.Continue()).toEqual("int truthy greater or equal\n");
    expect(context.story.Continue()).toEqual("int falsy greater or equal\n");

    expect(context.story.Continue()).toEqual("int truthy lesser or equal\n");
    expect(context.story.Continue()).toEqual("int falsy lesser or equal\n");

    expect(context.story.Continue()).toEqual("int truthy not equal\n");
    expect(context.story.Continue()).toEqual("int falsy not equal\n");

    expect(context.story.Continue()).toEqual("int truthy not\n");
    expect(context.story.Continue()).toEqual("int falsy not\n");

    expect(context.story.Continue()).toEqual("int truthy and\n");
    expect(context.story.Continue()).toEqual("int falsy and\n");

    expect(context.story.Continue()).toEqual("int truthy or\n");
    expect(context.story.Continue()).toEqual("int falsy or\n");

    expect(parseFloat(context.story.Continue())).toBeCloseTo(2.6);
    expect(parseFloat(context.story.Continue())).toBeCloseTo(0);
    expect(parseFloat(context.story.Continue())).toBeCloseTo(-5.2);
    expect(parseFloat(context.story.Continue())).toBeCloseTo(3.6);
    expect(parseFloat(context.story.Continue())).toBeCloseTo(4.2);
    expect(parseFloat(context.story.Continue())).toBeCloseTo(1.5);

    expect(context.story.Continue()).toEqual("float truthy equal\n");
    expect(context.story.Continue()).toEqual("float falsy equal\n");

    expect(context.story.Continue()).toEqual("float truthy greater\n");
    expect(context.story.Continue()).toEqual("float falsy greater\n");

    expect(context.story.Continue()).toEqual("float truthy lesser\n");
    expect(context.story.Continue()).toEqual("float falsy lesser\n");

    expect(context.story.Continue()).toEqual("float truthy greater or equal\n");
    expect(context.story.Continue()).toEqual("float falsy greater or equal\n");

    expect(context.story.Continue()).toEqual("float truthy lesser or equal\n");
    expect(context.story.Continue()).toEqual("float falsy lesser or equal\n");

    expect(context.story.Continue()).toEqual("float truthy not equal\n");
    expect(context.story.Continue()).toEqual("float falsy not equal\n");

    expect(context.story.Continue()).toEqual("float falsy not\n");

    expect(context.story.Continue()).toEqual("float truthy and\n");
    expect(context.story.Continue()).toEqual("float falsy and\n");

    expect(context.story.Continue()).toEqual("float truthy or\n");
    expect(context.story.Continue()).toEqual("float falsy or\n");

    expect(context.story.Continue()).toEqual("truthy string equal\n");
    expect(context.story.Continue()).toEqual("falsy string equal\n");
    expect(context.story.Continue()).toEqual("truthy string not equal\n");
    expect(context.story.Continue()).toEqual("falsy string not equal\n");
    expect(context.story.Continue()).toEqual("truthy divert equal\n");
    expect(context.story.Continue()).toEqual("falsy divert equal\n");
  });

  it("should perform if/else tests", () => {
    context.story.ChoosePathString("logic.ifelse");
    expect(context.story.Continue()).toEqual("if text\n");
    expect(context.story.Continue()).toEqual("else text\n");
    expect(context.story.Continue()).toEqual("elseif text\n");
  });

  it("should support params for stitches", () => {
    context.story.ChoosePathString("logic.stitch_param");
    expect(context.story.Continue()).toEqual("Called with param\n");
  });

  it("should define constants", () => {
    context.story.ChoosePathString("logic.constants");
    expect(context.story.Continue()).toEqual(
      "constants defined: Emilia 521 52.1\n"
    );
  });

  it("should call ink functions", () => {
    context.story.ChoosePathString("logic.simple_functions");

    expect(context.story.Continue()).toEqual("returned\n");
    expect(context.story.Continue()).toEqual("function called\n");
    expect(context.story.Continue()).toEqual("nested function called\n");
    expect(context.story.Continue()).toEqual(
      "Function called inline and returned something\n"
    );
  });

  it("should call ink functions", () => {
    context.story.ChoosePathString("logic.param_functions");

    expect(context.story.variablesState["fnParamA"]).toEqual("a");
    expect(context.story.variablesState["fnParamB"]).toEqual("b");

    expect(context.story.Continue()).toEqual("was a\n");
    expect(context.story.variablesState["fnParamA"]).toEqual("a");
    expect(context.story.variablesState["fnParamB"]).toEqual("b");

    expect(context.story.Continue()).toEqual("was a\n");
    expect(context.story.variablesState["fnParamA"]).toEqual("was a");
    expect(context.story.variablesState["fnParamB"]).toEqual("was b");

    expect(context.story.canContinue).toBe(false);
  });

  it("should call ink functions", () => {
    context.story.ChoosePathString("logic.void_function");
    context.story.Continue();

    expect(context.story.canContinue).toBe(false);
  });

  it("should generate random numbers", () => {
    context.story.ChoosePathString("logic.random");

    expect(context.story.Continue()).toEqual("27\n");
    expect(context.story.Continue()).toEqual("8\n");
  });
});
