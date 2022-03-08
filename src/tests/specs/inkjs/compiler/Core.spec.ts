import { CharacterSet } from "../../../../compiler/Parser/CharacterSet";
import { InkParser } from "../../../../compiler/Parser/InkParser";

describe("Core parsers", () => {
  it("parses moo", () => {
    const parser = new InkParser(`moo text and then an arrow\n-> happens `);
    const ret = parser.ParseString("moo");
    expect(ret).toBe("moo");
    expect(parser.index).toBe(3);
  });

  it("parses moo until", () => {
    const parser = new InkParser(`moo text -> and then an -> happens `);

    const ret = parser.ParseUntilCharactersFromString("->");
    expect(ret).toBe("moo text ");
    expect(parser.index).toBe(9);

    parser.ParseString("->");

    const ret2 = parser.ParseUntilCharactersFromString("->");
    expect(ret2).toBe(" and then an ");
    expect(parser.index).toBe(24);
  });

  it("parses newLine", () => {
    const parser = new InkParser(
      `moo text and \nthen an -> happens\nand what ?`
    );
    parser.index = 13;

    const ret = parser.ParseNewline();
    expect(ret).toBe("\n");
    expect(parser.index).toBe(14);

    const ret2 = parser.ParseUntilCharactersFromString("->");
    expect(ret2).toBe("then an ");
    expect(parser.index).toBe(22);

    const ret2b = parser.ParseUntil(parser.Newline, new CharacterSet("\n\r"));
    expect(ret2b).toBe("-> happens");
    expect(parser.index).toBe(32);
    parser.index = 22;

    const ret2t = parser.ParseUntil(parser.EndOfFile, new CharacterSet("\n\r"));
    expect(ret2t).toBe("-> happens\nand what ?");
    expect(parser.index).toBe(43);
    parser.index = 22;

    const ret3 = parser.ParseUntil(
      () => parser.OneOf([parser.Newline, parser.EndOfFile]),
      new CharacterSet("\n\r")
    );
    expect(ret3).toBe("-> happens");
    expect(parser.index).toBe(32);
  });

  it("parses interleave simple", () => {
    const parser = new InkParser(`ABABA`);
    const ret = parser.Interleave(
      () => parser.ParseString("A"),
      () => parser.ParseString("B")
    );
    expect(ret).toStrictEqual(["A", "B", "A", "B", "A"]);
  });

  it("parses interleave complex 1", () => {
    const parser = new InkParser(`A\n\n    \nB\nA\nC   \n\nA\nB\nD\nA\nB\n`);
    const ret = parser.Interleave(
      parser.Optional(parser.MultilineWhitespace),
      () =>
        parser.OneOf([
          () => parser.ParseString("A"),
          () => parser.ParseString("B"),
          () => parser.ParseString("C"),
        ]),
      () => parser.ParseString("D")
    );
    expect(ret).toStrictEqual(["A", "B", "A", "C", "A", "B"]);
    expect(parser.index).toBe(22);
  });
});
