import { CharacterSet } from "../CharacterSet";
import { ParsedObject } from "../ParsedHierarchy/Object";
import { StringParserState } from "./StringParserState";
import { StringParserElement } from "./StringParserElement";

export const ParseSuccess = Symbol("ParseSuccessStruct");

export type ParseRule = () => ParseRuleReturn;

export type ParseRuleReturn =
  | object
  | string
  | null
  | number
  | (typeof StringParser)["ParseSuccess"];

export type SpecificParseRule<T extends ParseRule> = T;

export class StringParser {
  public ParseRule: ParseRule | null = null;

  public static readonly ParseSuccess: typeof ParseSuccess = ParseSuccess;
  public static readonly numbersCharacterSet = new CharacterSet("0123456789");

  private _chars: string[];

  public errorHandler:
    | null
    | ((
        message: string,
        index: number,
        lineIndex?: number,
        isWarning?: boolean
      ) => void) = null;
  public state: StringParserState;
  public hadError: boolean = false;

  constructor(str: string) {
    const strPreProc = this.PreProcessInputString(str);
    this.state = new StringParserState();

    if (str) {
      this._chars = strPreProc.split("");
    } else {
      this._chars = [];
    }

    this.inputString = strPreProc;
  }

  get currentCharacter(): string {
    if (this.index >= 0 && this.remainingLength > 0) {
      return this._chars[this.index];
    }

    return "0";
  }

  // Don't do anything by default, but provide ability for subclasses
  // to manipulate the string before it's used as input (converted to a char array)
  public PreProcessInputString(str: string): string {
    return str;
  }

  //--------------------------------
  // Parse state
  //--------------------------------

  public readonly BeginRule = (): number => this.state.Push();

  public readonly FailRule = (expectedRuleId: number): ParseRuleReturn => {
    this.state.Pop(expectedRuleId);
    return null;
  };

  public readonly CancelRule = (expectedRuleId: number): void => {
    this.state.Pop(expectedRuleId);
  };

  public readonly SucceedRule = (
    expectedRuleId: number,
    result: ParseRuleReturn = null
  ): ParseRuleReturn => {
    // Get state at point where this rule stared evaluating
    const stateAtSucceedRule = this.state.Peek(expectedRuleId);
    const stateAtBeginRule = this.state.PeekPenultimate();

    // Allow subclass to receive callback
    if (this.RuleDidSucceed) {
      this.RuleDidSucceed(result, stateAtBeginRule, stateAtSucceedRule);
    }

    // Flatten state stack so that we maintain the same values,
    // but remove one level in the stack.
    this.state.Squash();

    let finalResult: ParseRuleReturn = result;
    if (finalResult === null) {
      finalResult = StringParser.ParseSuccess;
    }

    return finalResult;
  };

  public RuleDidSucceed?: (
    result: ParseRuleReturn,
    startState: StringParserElement | null,
    endState: StringParserElement
  ) => void;

  public readonly Expect = (
    rule: ParseRule,
    message: string | null = null,
    recoveryRule: ParseRule | null = null
  ): ParseRuleReturn => {
    let result: ParseRuleReturn = this.ParseObject(rule);
    if (result === null) {
      if (message === null) {
        message = rule.name;
      }

      let butSaw: string;
      const lineRemainder: string = this.LineRemainder();
      if (lineRemainder === null || lineRemainder.length === 0) {
        butSaw = "end of line";
      } else {
        butSaw = `'${lineRemainder}'`;
      }

      this.Error(`Expected ${message} but saw ${butSaw}`);

      if (recoveryRule !== null) {
        result = recoveryRule();
      }
    }

    return result;
  };

  public Error = (message: string, isWarning: boolean = false): void => {
    this.ErrorOnLine(message, this.lineIndex + 1, isWarning);
  };

  public readonly ErrorWithParsedObject = (
    message: string,
    result: ParsedObject,
    isWarning: boolean = false
  ): void => {
    this.ErrorOnLine(
      message,
      result.debugMetadata ? result.debugMetadata.startLineNumber : -1,
      isWarning
    );
  };

  public readonly ErrorOnLine = (
    message: string,
    lineNumber: number,
    isWarning: boolean
  ): void => {
    if (!this.state.errorReportedAlreadyInScope) {
      const errorType = isWarning ? "Warning" : "Error";

      if (!this.errorHandler) {
        throw new Error(`${errorType} on line ${lineNumber}: ${message}`);
      } else {
        this.errorHandler(message, this.index, lineNumber - 1, isWarning);
      }

      this.state.NoteErrorReported();
    }

    if (!isWarning) {
      this.hadError = true;
    }
  };

  public readonly Warning = (message: string): void =>
    this.Error(message, true);

  get endOfInput(): boolean {
    return this.index >= this._chars.length;
  }

  get remainingString(): string {
    return this._chars
      .slice(this.index, this.index + this.remainingLength)
      .join("");
  }

  public readonly LineRemainder = (): string =>
    this.Peek(() => this.ParseUntilCharactersFromString("\n\r")) as string;

  get remainingLength() {
    return this._chars.length - this.index;
  }

  public inputString: string;

  get lineIndex() {
    return this.state.lineIndex;
  }

  set lineIndex(value: number) {
    this.state.lineIndex = value;
  }

  set characterInLineIndex(value: number) {
    this.state.characterInLineIndex = value;
  }

  get characterInLineIndex() {
    return this.state.characterInLineIndex;
  }

  get index(): number {
    // If we want subclass parsers to be able to set the index directly,
    // then we would need to know what the lineIndex of the new
    // index would be - would we have to step through manually
    // counting the newlines to do so?
    return this.state.characterIndex;
  }

  set index(value: number) {
    this.state.characterIndex = value;
  }

  public readonly SetFlag = (flag: number, trueOrFalse: boolean): void => {
    if (trueOrFalse) {
      this.state.customFlags |= flag;
    } else {
      this.state.customFlags &= ~flag;
    }
  };

  public readonly GetFlag = (flag: number): boolean =>
    Boolean(this.state.customFlags & flag);

  //--------------------------------
  // Structuring
  //--------------------------------

  public ParseObject = (rule: ParseRule): ParseRuleReturn => {
    const ruleId: number = this.BeginRule();
    const stackHeightBefore = this.state.stackHeight;
    const result = rule();

    if (stackHeightBefore !== this.state.stackHeight) {
      throw new Error("Mismatched Begin/Fail/Succeed rules");
    }

    if (result === null) {
      return this.FailRule(ruleId);
    }

    this.SucceedRule(ruleId, result);

    return result;
  };

  public readonly Parse = <T extends ParseRule>(
    rule: SpecificParseRule<T>
  ): ParseRuleReturn => {
    const ruleId: number = this.BeginRule();

    const result: ParseRuleReturn = rule();
    if (result === null) {
      this.FailRule(ruleId);
      return null;
    }

    this.SucceedRule(ruleId, result);

    return result;
  };

  public readonly OneOf = (array: ParseRule[]): ParseRuleReturn => {
    for (const rule of array) {
      const result = this.ParseObject(rule);
      if (result !== null) {
        return result;
      }
    }

    return null;
  };

  public readonly OneOrMore = (rule: ParseRule): ParseRuleReturn[] | null => {
    const results: ParseRuleReturn[] = [];
    let result: ParseRuleReturn = null;

    do {
      result = this.ParseObject(rule);
      if (result !== null) {
        results.push(result);
      }
    } while (result !== null);

    if (results.length > 0) {
      return results;
    }

    return null;
  };

  public readonly Optional =
    (rule: ParseRule): ParseRule =>
    () => {
      const result = this.ParseObject(rule);
      if (result === null) return StringParser.ParseSuccess;
      return result;
    };

  // Return ParseSuccess instead the real result so that it gets excluded
  // from result arrays (e.g. Interleave)
  public readonly Exclude =
    (rule: ParseRule): ParseRule =>
    () =>
      this.ParseObject(rule) && StringParser.ParseSuccess;

  // Combination of both of the above
  public readonly OptionalExclude =
    (rule: ParseRule): ParseRule =>
    () => {
      this.ParseObject(rule);
      return StringParser.ParseSuccess;
    };

  // Convenience method for creating more readable ParseString rules that can be combined
  // in other structuring rules (like OneOf etc)
  // e.g. OneOf(String("one"), String("two"))
  public readonly String =
    (str: string): ParseRule =>
    () =>
      this.ParseString(str);

  private readonly TryAddResultToList = <T>(
    result: ParseRuleReturn,
    list: T[],
    flatten: boolean = true
  ): void => {
    if (result === StringParser.ParseSuccess) {
      return;
    }

    if (flatten && Array.isArray(result)) {
      const resultCollection = result as ParseRuleReturn[];
      if (resultCollection !== null) {
        for (const obj of resultCollection) {
          list.push(obj as any);
        }

        return;
      }
    }

    list.push(result as any);
  };

  public readonly Interleave = <T>(
    ruleA: ParseRule,
    ruleB: ParseRule,
    untilTerminator: ParseRule | null = null,
    flatten: boolean = true
  ): T[] => {
    const ruleId: number = this.BeginRule();
    const results: T[] = [];

    // First outer padding
    const firstA = this.ParseObject(ruleA);
    if (firstA === null) {
      return this.FailRule(ruleId) as any;
    } else {
      this.TryAddResultToList(firstA, results, flatten);
    }

    let lastMainResult: ParseRuleReturn | null = null;
    let outerResult: ParseRuleReturn | null = null;
    do {
      // "until" condition hit?
      if (untilTerminator !== null && this.Peek(untilTerminator) !== null) {
        break;
      }

      // Main inner
      lastMainResult = this.ParseObject(ruleB);
      if (lastMainResult === null) {
        break;
      } else {
        this.TryAddResultToList(lastMainResult, results, flatten);
      }

      // Outer result (i.e. last A in ABA)
      outerResult = null;
      if (lastMainResult !== null) {
        outerResult = this.ParseObject(ruleA);

        if (outerResult === null) {
          break;
        } else {
          this.TryAddResultToList(outerResult, results, flatten);
        }
      }

      // Stop if there are no results, or if both are the placeholder "ParseSuccess" (i.e. Optional success rather than a true value)
    } while (
      (lastMainResult !== null || outerResult !== null) &&
      !(
        (lastMainResult as any) === StringParser.ParseSuccess &&
        outerResult == StringParser.ParseSuccess
      ) &&
      this.remainingLength > 0
    );

    if (results.length === 0) {
      return this.FailRule(ruleId) as T[];
    }

    return this.SucceedRule(ruleId, results) as T[];
  };

  //--------------------------------
  // Basic string parsing
  //--------------------------------

  public readonly ParseString = (str: string): string | null => {
    if (str.length > this.remainingLength) {
      return null;
    }

    const ruleId: number = this.BeginRule();

    // Optimisation from profiling:
    // Store in temporary local variables
    // since they're properties that would have to access
    // the rule stack every time otherwise.
    let i: number = this.index;
    let cli: number = this.characterInLineIndex;
    let li: number = this.lineIndex;

    let success: boolean = true;
    for (let tempIdx = 0; tempIdx < str.length; tempIdx += 1) {
      const c = str[tempIdx];

      if (this._chars[i] !== c) {
        success = false;
        break;
      }
      if (c === "\n") {
        li++;
        cli = -1;
      }

      i++;
      cli++;
    }

    this.index = i;
    this.characterInLineIndex = cli;
    this.lineIndex = li;

    if (success) {
      return this.SucceedRule(ruleId, str) as any;
    }

    return this.FailRule(ruleId) as any;
  };

  public readonly ParseSingleCharacter = (): string => {
    if (this.remainingLength > 0) {
      const c = this._chars[this.index];
      if (c === "\n") {
        this.lineIndex += 1;
        this.characterInLineIndex = -1;
      }

      this.index += 1;
      this.characterInLineIndex += 1;

      return c;
    }

    return "0";
  };

  public readonly ParseUntilCharactersFromString = (
    str: string,
    maxCount: number = -1
  ): string | null => this.ParseCharactersFromString(str, false, maxCount);

  public readonly ParseUntilCharactersFromCharSet = (
    charSet: CharacterSet,
    maxCount: number = -1
  ): string | null => this.ParseCharactersFromCharSet(charSet, false, maxCount);

  public readonly ParseCharactersFromString = (
    str: string,
    maxCountOrShouldIncludeStrChars: boolean | number = -1,
    maxCount: number = -1
  ): string | null => {
    const charSet = new CharacterSet(str);
    if (typeof maxCountOrShouldIncludeStrChars === "number") {
      return this.ParseCharactersFromCharSet(
        charSet,
        true,
        maxCountOrShouldIncludeStrChars
      );
    }

    return this.ParseCharactersFromCharSet(
      charSet,
      maxCountOrShouldIncludeStrChars,
      maxCount
    );
  };

  public readonly ParseCharactersFromCharSet = (
    charSet: CharacterSet,
    shouldIncludeChars: boolean = true,
    maxCount: number = -1
  ): string | null => {
    if (maxCount === -1) {
      maxCount = Number.MAX_SAFE_INTEGER;
    }

    const startIndex: number = this.index;

    // Optimisation from profiling:
    // Store in temporary local variables
    // since they're properties that would have to access
    // the rule stack every time otherwise.
    let ii: number = this.index;
    let cli: number = this.characterInLineIndex;
    let li: number = this.lineIndex;
    let count: number = 0;
    while (
      ii < this._chars.length &&
      charSet.set.has(this._chars[ii]) === shouldIncludeChars &&
      count < maxCount
    ) {
      if (this._chars[ii] === "\n") {
        li += 1;
        cli = -1;
      }

      ii += 1;
      cli += 1;
      count += 1;
    }

    this.index = ii;
    this.characterInLineIndex = cli;
    this.lineIndex = li;

    const lastCharIndex: number = this.index;
    if (lastCharIndex > startIndex) {
      return this._chars.slice(startIndex, this.index).join("");
    }

    return null;
  };

  public readonly Peek = (rule: ParseRule): ParseRuleReturn => {
    const ruleId: number = this.BeginRule();
    const result: ParseRuleReturn = rule();
    this.CancelRule(ruleId);

    return result;
  };

  public ParseUntil(
    stopRule: ParseRule,
    pauseCharacters: CharacterSet | null = null,
    endCharacters: CharacterSet | null = null
  ): string {
    const ruleId: number = this.BeginRule();
    const pauseAndEnd: CharacterSet = new CharacterSet();
    if (pauseCharacters !== null) {
      pauseAndEnd.set = new Set([
        ...pauseAndEnd.set.values(),
        ...pauseCharacters.set.values(),
      ]);
    }

    if (endCharacters !== null) {
      pauseAndEnd.set = new Set([
        ...pauseAndEnd.set.values(),
        ...endCharacters.set.values(),
      ]);
    }

    let parsedString = "";
    let ruleResultAtPause: ParseRuleReturn | null = null;

    // Keep attempting to parse strings up to the pause (and end) points.
    //  - At each of the pause points, attempt to parse according to the rule
    //  - When the end point is reached (or EOF), we're done
    do {
      // TODO: Perhaps if no pause or end characters are passed, we should check *every* character for stopRule?
      const partialParsedString: string | null =
        this.ParseUntilCharactersFromCharSet(pauseAndEnd);

      if (partialParsedString) {
        parsedString += partialParsedString;
      }

      // Attempt to run the parse rule at this pause point
      ruleResultAtPause = this.Peek(stopRule);

      // Rule completed - we're done
      if (ruleResultAtPause !== null) {
        break;
      } else {
        if (this.endOfInput) {
          break;
        }

        // Reached a pause point, but rule failed. Step past and continue parsing string
        const pauseCharacter: string = this.currentCharacter;
        if (
          pauseCharacters !== null &&
          pauseCharacters.set.has(pauseCharacter)
        ) {
          parsedString += pauseCharacter;
          if (pauseCharacter === "\n") {
            this.lineIndex += 1;
            this.characterInLineIndex = -1;
          }

          this.index += 1;
          this.characterInLineIndex += 1;

          continue;
        } else {
          break;
        }
      }
    } while (true);

    if (parsedString.length > 0) {
      return this.SucceedRule(ruleId, String(parsedString)) as string;
    }

    return this.FailRule(ruleId) as string;
  }

  // No need to Begin/End rule since we never parse a newline, so keeping oldIndex is good enough
  public readonly ParseInt = (): number | null => {
    const oldIndex: number = this.index;
    const oldCharacterInLineIndex: number = this.characterInLineIndex;
    const negative: boolean = this.ParseString("-") !== null;

    // Optional whitespace
    this.ParseCharactersFromString(" \t");

    const parsedString = this.ParseCharactersFromCharSet(
      StringParser.numbersCharacterSet
    );
    if (parsedString === null) {
      // Roll back and fail
      this.index = oldIndex;
      this.characterInLineIndex = oldCharacterInLineIndex;

      return null;
    }

    let parsedInt: number;
    if (!Number.isNaN(Number(parsedString))) {
      parsedInt = Number(parsedString);
      return negative ? -parsedInt : parsedInt;
    }

    this.Error(
      "Failed to read integer value: " +
        parsedString +
        ". Perhaps it's out of the range of acceptable numbers ink supports? (" +
        Number.MIN_SAFE_INTEGER +
        " to " +
        Number.MAX_SAFE_INTEGER +
        ")"
    );

    return null;
  };

  // No need to Begin/End rule since we never parse a newline, so keeping oldIndex is good enough
  public readonly ParseFloat = (): number | null => {
    const oldIndex: number = this.index;
    const oldCharacterInLineIndex: number = this.characterInLineIndex;

    const leadingInt: number | null = this.ParseInt();
    if (leadingInt !== null) {
      if (this.ParseString(".") !== null) {
        const afterDecimalPointStr = this.ParseCharactersFromCharSet(
          StringParser.numbersCharacterSet
        );

        return Number(`${leadingInt}.${afterDecimalPointStr}`);
      }
    }

    // Roll back and fail
    this.index = oldIndex;
    this.characterInLineIndex = oldCharacterInLineIndex;

    return null;
  };

  public readonly ParseNewline = (): string => {
    const ruleId: number = this.BeginRule();

    // Optional \r, definite \n to support Windows (\r\n) and Mac/Unix (\n)
    // 2nd May 2016: Always collapse \r\n to just \n
    this.ParseString("\r");

    if (this.ParseString("\n") === null) {
      return this.FailRule(ruleId) as string;
    }

    return this.SucceedRule(ruleId, "\n") as string;
  };
}
