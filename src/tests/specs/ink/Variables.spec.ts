import * as testsUtils from "../common";

describe("Variables", () => {
  let story: any;

  function loadStory(name: any) {
    story = testsUtils.loadInkFile(name, "variables");
  }

  beforeEach(() => {
    story = undefined;
  });

  it("tests const", () => {
    loadStory("const");

    expect(story.Continue()).toBe("5\n");
  });

  it("tests multiple constant references", () => {
    loadStory("multiple_constant_references");

    expect(story.Continue()).toBe("success\n");
  });

  it("tests set non existent variable", () => {
    loadStory("set_non_existant_variable");

    expect(story.Continue()).toBe("Hello world.\n");

    expect(() => {
      story.variablesState["y"] = "earth";
    }).toThrow();
  });

  it("tests temp global conflict", () => {
    loadStory("temp_global_conflict");

    expect(story.Continue()).toBe("0\n");
  });

  it("tests temp not found", () => {
    loadStory("temp_not_found");

    expect(story.ContinueMaximally()).toBe("0\nhello\n");
    expect(story.hasWarning).toBe(true);
  });

  it("tests temp usage in options", () => {
    loadStory("temp_usage_in_options");

    story.Continue();

    expect(story.currentChoices.length).toBe(1);
    expect(story.currentChoices[0].text).toBe("1");

    story.ChooseChoiceIndex(0);
    expect(story.ContinueMaximally()).toBe("1\nEnd of choice\nthis another\n");
    expect(story.currentChoices.length).toBe(0);
  });

  it("tests temporaries at global scope", () => {
    loadStory("temporaries_at_global_scope");

    expect(story.Continue()).toBe("54\n");
  });

  it("tests variable declaration in conditional", () => {
    loadStory("variable_declaration_in_conditional");

    expect(story.Continue()).toBe("5\n");
  });

  it("tests variable declaration in conditional", () => {
    loadStory("variable_divert_target");

    expect(story.Continue()).toBe("Here.\n");
  });

  it("tests variable get set api", () => {
    loadStory("variable_get_set_api");

    expect(story.ContinueMaximally()).toBe("5\n");
    expect(story.variablesState["x"]).toBe(5);

    story.variablesState["x"] = 10;
    story.ChooseChoiceIndex(0);
    expect(story.ContinueMaximally()).toBe("10\n");
    expect(story.variablesState["x"]).toBe(10);

    story.variablesState["x"] = 8.5;
    story.ChooseChoiceIndex(0);
    expect(story.ContinueMaximally()).toBe("8.5\n");
    expect(story.variablesState["x"]).toBe(8.5);

    story.variablesState["x"] = "a string";
    story.ChooseChoiceIndex(0);
    expect(story.ContinueMaximally()).toBe("a string\n");
    expect(story.variablesState["x"]).toBe("a string");

    expect(story.variablesState["z"]).toBe(null);

    expect(() => {
      // Arbitrary type. Note that [] gets converted to 0, which may not
      // be what we want.
      story.variablesState["x"] = new Map();
    }).toThrow();
  });

  it("tests variable pointer ref from knot", () => {
    loadStory("variable_pointer_ref_from_knot");

    expect(story.Continue()).toBe("6\n");
  });

  it("tests variable swap recurse", () => {
    loadStory("variable_swap_recurse");

    expect(story.ContinueMaximally()).toBe("1 2\n");
  });

  it("tests variable pointer ref from knot", () => {
    loadStory("variable_tunnel");

    expect(story.ContinueMaximally()).toBe("STUFF\n");
  });
});
