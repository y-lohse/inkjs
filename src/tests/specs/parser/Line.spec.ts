import { InkParser } from "../../../compiler/Parser/InkParser";

describe("Core parsers", () => {
  it("parses moo", () => {
    const parser = new InkParser(`Once upon a time...
There was 2 choices`);
    // const ret = parser.MixedTextAndLogic();
    const ret = parser.ContentTextNoEscape();

    const ret2 = parser.Interleave(
      parser.Optional(parser.ContentText),
      parser.Optional(parser.InlineLogicOrGlue)
    );
  });
});
