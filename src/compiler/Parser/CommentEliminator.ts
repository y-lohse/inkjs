import { CharacterSet } from "./CharacterSet";
import { StringParser } from "./StringParser/StringParser";

/// <summary>
/// Pre-pass before main ink parser runs. It actually performs two main tasks:
///  - comment elimination to simplify the parse rules in the main parser
///  - Conversion of Windows line endings (\r\n) to the simpler Unix style (\n), so
///    we don't have to worry about them later.
/// </summary>
export class CommentEliminator extends StringParser {
  public _commentOrNewlineStartCharacter = new CharacterSet("/\r\n");
  public _commentBlockEndCharacter = new CharacterSet("*");
  public _newlineCharacters = new CharacterSet("\n\r");

  public readonly Process = (): string => {
    // Make both comments and non-comments optional to handle trivial empty file case (or *only* comments)
    const stringList: string[] = this.Interleave<string>(
      this.Optional(this.CommentsAndNewlines),
      this.Optional(this.MainInk)
    );

    if (stringList !== null) {
      return stringList.join("");
    } else {
      return "";
    }
  };

  public readonly MainInk = () =>
    this.ParseUntil(
      this.CommentsAndNewlines,
      this._commentOrNewlineStartCharacter,
      null
    );

  public readonly CommentsAndNewlines = () => {
    let newLines: string[] = this.Interleave<string>(
      this.Optional(this.ParseNewline),
      this.Optional(this.ParseSingleComment)
    );

    if (newLines !== null) {
      return newLines.join("");
    }

    return null;
  };

  // Valid comments always return either an empty string or pure newlines,
  // which we want to keep so that line numbers stay the same
  public readonly ParseSingleComment = () =>
    this.OneOf([this.EndOfLineComment, this.BlockComment]);

  public readonly EndOfLineComment = () => {
    if (this.ParseString("//") === null) {
      return null;
    }

    this.ParseUntilCharactersFromCharSet(this._newlineCharacters);

    return "";
  };

  public readonly BlockComment = () => {
    if (this.ParseString("/*") === null) {
      return null;
    }

    const startLineIndex: number = this.lineIndex;
    const commentResult = this.ParseUntil(
      this.String("*/"),
      this._commentBlockEndCharacter,
      null
    );

    if (!this.endOfInput) {
      this.ParseString("*/");
    }

    // Count the number of lines that were inside the block, and replicate them as newlines
    // so that the line indexing still works from the original source
    if (commentResult != null) {
      return "\n".repeat(this.lineIndex - startLineIndex);
    }

    // No comment at all
    return null;
  };

  public PreProcessInputString(str: string): string {
    return str;
  }
}
