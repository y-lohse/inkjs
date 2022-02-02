import { InkParser } from "../../../compiler/Parser/InkParser";
import { ParseRule } from "../../../compiler/Parser/StringParser/StringParser";

const getParser = () => new InkParser(`
Once upon a time...

* There were two choices.
* There were four lines of content.

- They lived happily ever after.
-> END

`)

describe("Choices", () => {
    const parser = getParser();
    const rules: ParseRule[] = []; 
          //rules.push(parser.Line(parser.MultiDivert));
          //rules.push(parser.KnotDefinition);
          rules.push(parser.LineOfMixedTextAndLogic);

    const ret = parser.Interleave(
        parser.Optional(parser.MultilineWhitespace), 
        () => parser.OneOf(rules), 
      );

})

