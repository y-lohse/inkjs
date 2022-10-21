import { InkParser } from "../../../compiler/Parser/InkParser";
import { StringParser } from "../../../compiler/Parser/StringParser/StringParser";
import { CharacterRange } from "../../../compiler/Parser/CharacterRange";
import { CharacterSet } from "../../../compiler/Parser/CharacterSet";

describe("Parser", () => {
  // TestStringParserA
  it("tests string parser A", () => {
    let parser = new StringParser("A");
    let results = parser.Interleave(
      () => parser.ParseString("A"),
      () => parser.ParseString("B")
    );

    expect(results).toEqual(["A"]);
  });

  // TestStringParserABAB
  it("tests string parser ABAB", () => {
    let parser = new StringParser("ABAB");
    let results = parser.Interleave(
      () => parser.ParseString("A"),
      () => parser.ParseString("B")
    );

    expect(results).toEqual(["A", "B", "A", "B"]);
  });

  // TestStringParserABAOptional
  it("tests string parser ABA optional", () => {
    let parser = new StringParser("ABAA");
    let results = parser.Interleave(
      () => parser.ParseString("A"),
      parser.Optional(() => parser.ParseString("B"))
    );

    expect(results).toEqual(["A", "B", "A", "A"]);
  });

  // TestStringParserABAOptional2
  it("tests string parser ABA optional 2", () => {
    let parser = new StringParser("BABB");
    let results = parser.Interleave(
      parser.Optional(() => parser.ParseString("A")),
      () => parser.ParseString("B")
    );

    expect(results).toEqual(["B", "A", "B", "B"]);
  });

  // TestStringParserB
  it("tests string parser B", () => {
    let parser = new StringParser("B");
    let results = parser.Interleave(
      () => parser.ParseString("A"),
      () => parser.ParseString("B")
    );

    expect(results).toBeNull();
  });

  // TestCharacterRangeIdentifiersForConstNamesWithAsciiPrefix
  it("tests character range identifier for const names with ASCII prefix", () => {
    let ranges = InkParser.ListAllCharacterRanges();
    ranges.forEach((range) => {
      let identifier = generateIdentifierFromCharacterRange(range);
      let storyString = `
CONST pi${identifier} = 3.1415
CONST a${identifier} = "World"
CONST b${identifier} = 3
`;
      let parser = new InkParser(storyString);
      let compiledStory = parser.ParseStory();

      expect(compiledStory).not.toBeNull();
    });
  });

  // TestCharacterRangeIdentifiersForConstNamesWithAsciiSuffix
  it("tests character range identifier for const names with ASCII suffix", () => {
    let ranges = InkParser.ListAllCharacterRanges();
    ranges.forEach((range) => {
      let identifier = generateIdentifierFromCharacterRange(range);
      let storyString = `
CONST ${identifier}pi = 3.1415
CONST ${identifier}a = "World"
CONST ${identifier}b = 3
`;
      let parser = new InkParser(storyString);
      let compiledStory = parser.ParseStory();

      expect(compiledStory).not.toBeNull();
    });
  });

  // TestCharacterRangeIdentifiersForSimpleVariableNamesWithAsciiPrefix
  it("tests character range identifier for simple variable names with ASCII prefix", () => {
    let ranges = InkParser.ListAllCharacterRanges();
    ranges.forEach((range) => {
      let identifier = generateIdentifierFromCharacterRange(range);
      let storyString = `
VAR ${identifier}pi = 3.1415
VAR ${identifier}a = "World"
VAR ${identifier}b = 3
`;
      let parser = new InkParser(storyString);
      let compiledStory = parser.ParseStory();

      expect(compiledStory).not.toBeNull();
    });
  });

  // TestCharacterRangeIdentifiersForSimpleVariableNamesWithAsciiSuffix
  it("tests character range identifier for simple variable names with ASCII suffix", () => {
    let ranges = InkParser.ListAllCharacterRanges();
    ranges.forEach((range) => {
      let identifier = generateIdentifierFromCharacterRange(range);
      let storyString = `
VAR pi${identifier} = 3.1415
VAR a${identifier} = "World"
VAR b${identifier} = 3
`;
      let parser = new InkParser(storyString);
      let compiledStory = parser.ParseStory();

      expect(compiledStory).not.toBeNull();
    });
  });

  // TestCharacterRangeIdentifiersForDivertNamesWithAsciiPrefix
  it("tests character range identifier for divert names with ASCII prefix", () => {
    let ranges = InkParser.ListAllCharacterRanges();
    ranges.forEach((range) => {
      let rangeString = generateIdentifierFromCharacterRange(range);
      let storyString = `
VAR ${rangeString}z = -> ${rangeString}divert

== ${rangeString}divert ==
-> END
`;
      let parser = new InkParser(storyString);
      let compiledStory = parser.ParseStory();

      expect(compiledStory).not.toBeNull();
    });
  });

  // TestCharacterRangeIdentifiersForDivertNamesWithAsciiSuffix
  it("tests character range identifier for divert names with ASCII suffix", () => {
    let ranges = InkParser.ListAllCharacterRanges();
    ranges.forEach((range) => {
      let rangeString = generateIdentifierFromCharacterRange(range);
      let storyString = `
VAR z${rangeString} = -> divert${rangeString}

== divert${rangeString} ==
-> END
`;
      let parser = new InkParser(storyString);
      let compiledStory = parser.ParseStory();

      expect(compiledStory).not.toBeNull();
    });
  });
});

function generateIdentifierFromCharacterRange(
  range: CharacterRange,
  varNameUniquePart?: string
): string {
  let identifier: string;
  if (varNameUniquePart !== undefined && varNameUniquePart !== "") {
    identifier = varNameUniquePart;
  } else {
    identifier = "";
  }

  let charset: CharacterSet = range.ToCharacterSet();

  charset.set.forEach((character) => {
    identifier += character;
  });

  return identifier;
}
