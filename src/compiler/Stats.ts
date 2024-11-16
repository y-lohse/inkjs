import { Choice } from "./Parser/ParsedHierarchy/Choice";
import { Divert } from "./Parser/ParsedHierarchy/Divert/Divert";
import { Gather } from "./Parser/ParsedHierarchy/Gather/Gather";
import { Knot } from "./Parser/ParsedHierarchy/Knot";
import { Stitch } from "./Parser/ParsedHierarchy/Stitch";
import { Story } from "./Parser/ParsedHierarchy/Story";
import { Text } from "./Parser/ParsedHierarchy/Text";

export interface Stats {
  words: number;
  knots: number;
  stitches: number;
  functions: number;
  choices: number;
  gathers: number;
  diverts: number;
}

export function GenerateStoryStats(story: Story): Stats {
  let allText = story.FindAll(Text)();
  let words = 0;
  for (const text of allText) {
    let wordsInThisStr = 0;
    let wasWhiteSpace = true;
    for (const c of text.text) {
      if (c == " " || c == "\t" || c == "\n" || c == "\r") {
        wasWhiteSpace = true;
      } else if (wasWhiteSpace) {
        wordsInThisStr++;
        wasWhiteSpace = false;
      }
    }

    words += wordsInThisStr;
  }

  const knots = story.FindAll(Knot)();
  const stitches = story.FindAll(Stitch)();
  const choices = story.FindAll(Choice)();
  const gathers = story.FindAll(Gather)((g) => g.debugMetadata != null);
  const diverts = story.FindAll(Divert)();

  return {
    words,
    knots: knots.length,
    functions: knots.filter((k) => k.isFunction).length,
    stitches: stitches.length,
    gathers: gathers.length,
    diverts: diverts.length - 1,
    choices: choices.length,
  };
}
