import * as testsUtils from "../../common";

describe("Lists", () => {
  let context: testsUtils.TestContext;

  beforeEach(() => {
    context = testsUtils.makeDefaultTestContext("tests", "inkjs", true);
    context.story.allowExternalFunctionFallbacks = true;
  });

  it("should be defined", () => {
    context.story.ChoosePathString("lists.basic_list");

    expect(context.story.Continue()).toEqual("cold\n");
    expect(context.story.Continue()).toEqual("boiling\n");
  });

  it("should increment/decrement", () => {
    context.story.ChoosePathString("lists.increment");

    expect(context.story.Continue()).toEqual("cold\n");
    expect(context.story.Continue()).toEqual("boiling\n");
    expect(context.story.Continue()).toEqual("evaporated\n");
    expect(context.story.Continue()).toEqual("boiling\n");
    expect(context.story.Continue()).toEqual("cold\n");
  });

  it("should print the values", () => {
    context.story.ChoosePathString("lists.list_value");

    expect(context.story.Continue()).toEqual("1\n");
    expect(context.story.Continue()).toEqual("2\n");
    expect(context.story.Continue()).toEqual("3\n");
  });

  it("should set names from values", () => {
    context.story.ChoosePathString("lists.value_from_number");

    expect(context.story.Continue()).toEqual("cold\n");
    expect(context.story.Continue()).toEqual("boiling\n");
    expect(context.story.Continue()).toEqual("evaporated\n");
  });

  it("should handle user defined values", () => {
    context.story.ChoosePathString("lists.defined_value");
    expect(context.story.Continue()).toEqual("2\n");
    expect(context.story.Continue()).toEqual("3\n");

    // That's 0 and not 5, because it adds up to a non existing
    // list entry see https://github.com/inkle/ink/issues/441.
    expect(context.story.Continue()).toEqual("0\n");
  });

  it("should add and remove values from lists", () => {
    context.story.ChoosePathString("lists.multivalue");
    expect(context.story.Continue()).toEqual("\n");
    expect(context.story.Continue()).toEqual("Denver, Eamonn\n");
    expect(context.story.Continue()).toEqual("Denver\n");
    expect(context.story.Continue()).toEqual("\n");
    expect(context.story.Continue()).toEqual("\n");
    expect(context.story.Continue()).toEqual("Eamonn\n");
  });

  it("should resolve list queries", () => {
    context.story.ChoosePathString("lists.listqueries");
    expect(context.story.Continue()).toEqual("list is empty\n");
    expect(context.story.Continue()).toEqual("2\n");
    expect(context.story.Continue()).toEqual("Denver\n");
    expect(context.story.Continue()).toEqual("Eamonn\n");
    expect(context.story.Continue()).toEqual("list is not empty\n");

    expect(context.story.Continue()).toEqual("exact equality\n");
    expect(context.story.Continue()).toEqual("falsy exact equality\n");
    expect(context.story.Continue()).toEqual("exact inequality\n");
    expect(context.story.Continue()).toEqual("exact inequality works\n");

    expect(context.story.Continue()).toEqual("has Eamonn\n");
    expect(context.story.Continue()).toEqual("has falsy works\n");
    expect(context.story.Continue()).toEqual("has not\n");
    expect(context.story.Continue()).toEqual("falsy has not\n");
    expect(context.story.Continue()).toEqual(
      "Adams, Bernard, Cartwright, Denver, Eamonn\n"
    );
    expect(context.story.Continue()).toEqual("\n");
    expect(context.story.Continue()).toEqual("\n");

    expect(context.story.Continue()).toEqual("truthy greater than\n");
    expect(context.story.Continue()).toEqual("falsy greater than\n");
    expect(context.story.Continue()).toEqual("greater than empty\n");
    expect(context.story.Continue()).toEqual("empty greater than\n");

    expect(context.story.Continue()).toEqual("truthy smaller than\n");
    expect(context.story.Continue()).toEqual("falsy smaller than\n");
    expect(context.story.Continue()).toEqual("smaller than empty\n");
    expect(context.story.Continue()).toEqual("empty smaller than\n");

    expect(context.story.Continue()).toEqual("truthy greater than or equal\n");
    expect(context.story.Continue()).toEqual("truthy greater than or equal\n");
    expect(context.story.Continue()).toEqual("falsy greater than or equal\n");
    expect(context.story.Continue()).toEqual("greater than or equals empty\n");
    expect(context.story.Continue()).toEqual("empty greater than or equals\n");

    expect(context.story.Continue()).toEqual("truthy smaller than or equal\n");
    expect(context.story.Continue()).toEqual("truthy smaller than or equal\n");
    expect(context.story.Continue()).toEqual("falsy smaller than or equal\n");
    expect(context.story.Continue()).toEqual("smaller than or equals empty\n");
    expect(context.story.Continue()).toEqual("empty smaller than or equals\n");

    expect(context.story.Continue()).toEqual("truthy list AND\n");
    expect(context.story.Continue()).toEqual("falsy list AND\n");
    expect(context.story.Continue()).toEqual("truthy list OR\n");
    expect(context.story.Continue()).toEqual("falsy list OR\n");
    expect(context.story.Continue()).toEqual("truthy list not\n");
    expect(context.story.Continue()).toEqual("falsy list not\n");

    expect(context.story.Continue()).toEqual("Bernard, Cartwright, Denver\n");
    expect(context.story.Continue()).toEqual("Smith, Jones\n");

    expect(context.story.Continue()).toEqual("Carter, Braithwaite\n");
    expect(context.story.Continue()).toEqual("self_belief\n");
  });
});
