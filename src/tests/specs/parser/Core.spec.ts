import { InkParser } from "../../../compiler/Parser/InkParser";

describe("Choices", () => {

    it("parses moo", ()  => {
        const parser = new InkParser(`moo text and then an arrow 
      -> happens `);
        const ret = parser.ParseString('moo');
        expect(ret).toBe('moo');
        expect(parser.index).toBe(3);
    });

    it("parses moo until", ()  => {
        const parser = new InkParser(`moo text -> and then an -> happens `);

        const ret = parser.ParseUntilCharactersFromString("->");
        expect(ret).toBe('moo text ');
        expect(parser.index).toBe(9);

        parser.ParseString("->");

        const ret2 = parser.ParseUntilCharactersFromString("->");
        expect(ret2).toBe(' and then an ');
        expect(parser.index).toBe(24);
    });

    it("parses newLine", ()  => {
        const parser = new InkParser(`moo text and 
then an -> happens
and what ?`);
             parser.index = 13;

        const ret = parser.ParseNewline();
        expect(ret).toBe("\n");
        expect(parser.index).toBe(14);

        const ret2 = parser.ParseUntilCharactersFromString("->")
        expect(ret2).toBe("then an ");
        expect(parser.index).toBe(22);

        const ret3 = parser.ParseUntil(() => parser.OneOf([
            parser.Newline,
            parser.EndOfFile
        ]))

        const ret4 = parser.ParseUntil(() => parser.OneOf([
            parser.Newline,
            parser.EndOfFile
        ]))

        debugger;

    });


})