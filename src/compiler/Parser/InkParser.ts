import { Argument } from "./ParsedHierarchy/Argument";
import { AuthorWarning } from "./ParsedHierarchy/AuthorWarning";
import { BinaryExpression } from "./ParsedHierarchy/Expression/BinaryExpression";
import { CharacterRange } from "./CharacterRange";
import { CharacterSet } from "./CharacterSet";
import { Choice } from "./ParsedHierarchy/Choice";
import { CommentEliminator } from "./CommentEliminator";
import { Conditional } from "./ParsedHierarchy/Conditional/Conditional";
import { ConditionalSingleBranch } from "./ParsedHierarchy/Conditional/ConditionalSingleBranch";
import { ContentList } from "./ParsedHierarchy/ContentList";
import { ConstantDeclaration } from "./ParsedHierarchy/Declaration/ConstantDeclaration";
import { CustomFlags } from "./CustomFlags";
import { DebugMetadata } from "../../engine/DebugMetadata";
import { Divert } from "./ParsedHierarchy/Divert/Divert";
import { DivertTarget } from "./ParsedHierarchy/Divert/DivertTarget";
import { Expression } from "./ParsedHierarchy/Expression/Expression";
import { ErrorHandler } from "../../engine/Error";
import { ExternalDeclaration } from "./ParsedHierarchy/Declaration/ExternalDeclaration";
import { FlowDecl } from "./FlowDecl";
import { FunctionCall } from "./ParsedHierarchy/FunctionCall";
import { Gather } from "./ParsedHierarchy/Gather/Gather";
import { Glue } from "./ParsedHierarchy/Glue";
import { Glue as RuntimeGlue } from "../../engine/Glue";
import { IFileHandler } from "../IFileHandler";
import { IncDecExpression } from "./ParsedHierarchy/Expression/IncDecExpression";
import { IncludedFile } from "./ParsedHierarchy/IncludedFile";
import { InfixOperator } from "./InfixOperator";
import { Knot } from "./ParsedHierarchy/Knot";
import { List } from "./ParsedHierarchy/List/List";
import { ListDefinition } from "./ParsedHierarchy/List/ListDefinition";
import { ListElementDefinition } from "./ParsedHierarchy/List/ListElementDefinition";
import { MultipleConditionExpression } from "./ParsedHierarchy/Expression/MultipleConditionExpression";
import { ParsedObject } from "./ParsedHierarchy/Object";
import { Path } from "./ParsedHierarchy/Path";
import { ReturnType } from "./ParsedHierarchy/ReturnType";
import { Sequence } from "./ParsedHierarchy/Sequence/Sequence";
import { SequenceType } from "./ParsedHierarchy/Sequence/SequenceType";
import { StatementLevel } from "./StatementLevel";
import { Stitch } from "./ParsedHierarchy/Stitch";
import { Story } from "./ParsedHierarchy/Story";
import { StringExpression } from "./ParsedHierarchy/Expression/StringExpression";
import {
  StringParser,
  SpecificParseRule,
  ParseRule,
  ParseRuleReturn,
  ParseSuccess,
} from "./StringParser/StringParser";
import { StringParserElement } from "./StringParser/StringParserElement";
import { Tag } from "./ParsedHierarchy/Tag";
import { Text } from "./ParsedHierarchy/Text";
import { TunnelOnwards } from "./ParsedHierarchy/TunnelOnwards";
import { VariableAssignment } from "./ParsedHierarchy/Variable/VariableAssignment";
import { VariableReference } from "./ParsedHierarchy/Variable/VariableReference";
import { UnaryExpression } from "./ParsedHierarchy/Expression/UnaryExpression";
import { asOrNull, filterUndef } from "../../engine/TypeAssertion";
import { Identifier } from "./ParsedHierarchy/Identifier";
import { NumberExpression } from "./ParsedHierarchy/Expression/NumberExpression";
import { ErrorType } from "./ErrorType";
import { DefaultFileHandler } from "../FileHandler/DefaultFileHandler";

export class InkParser extends StringParser {
  /**
   * Begin base InkParser section.
   */

  get fileHandler(): IFileHandler {
    if (!this._fileHandler) {
      throw new Error("No FileHandler defined");
    }
    return this._fileHandler;
  }

  set fileHandler(value: IFileHandler) {
    this._fileHandler = value;
  }

  constructor(
    str: string,
    filename: string | null = null,
    externalErrorHandler: ErrorHandler | null = null,
    rootParser: InkParser | null = null,
    fileHandler: IFileHandler | null = null
  ) {
    super(str);

    this._filename = filename;
    this.RegisterExpressionOperators();
    this.GenerateStatementLevelRules();

    this.errorHandler = this.OnStringParserError;

    this._externalErrorHandler = externalErrorHandler;

    if (fileHandler === null) {
      this._fileHandler = new DefaultFileHandler();
    } else {
      this._fileHandler = fileHandler;
    }

    if (rootParser === null) {
      this._rootParser = this;
      this._openFilenames = [];

      if (this._filename !== null) {
        const fullRootInkPath = this.fileHandler.ResolveInkFilename(
          this._filename
        );
        this._openFilenames.push(fullRootInkPath);
      }
    } else {
      this._rootParser = rootParser;
    }
  }

  // Main entry point
  // NOTE: This method is named Parse() in upstream.
  public readonly ParseStory = (): Story => {
    const topLevelContent: ParsedObject[] = this.StatementsAtLevel(
      StatementLevel.Top
    );

    // Note we used to return null if there were any errors, but this would mean
    // that include files would return completely empty rather than attempting to
    // continue with errors. Returning an empty include files meant that anything
    // that *did* compile successfully would otherwise be ignored, generating way
    // more errors than necessary.
    return new Story(topLevelContent, this._rootParser !== this);
  };

  public readonly SeparatedList = <T extends ParseRule>(
    mainRule: SpecificParseRule<T>,
    separatorRule: ParseRule
  ): ParseRuleReturn[] | null => {
    const firstElement: ParseRuleReturn = this.Parse(mainRule);
    if (firstElement === null) {
      return null;
    }

    const allElements = [];
    allElements.push(firstElement);

    do {
      const nextElementRuleId: number = this.BeginRule();
      let sep = separatorRule();
      if (sep === null) {
        this.FailRule(nextElementRuleId);
        break;
      }

      const nextElement = this.Parse(mainRule);
      if (nextElement === null) {
        this.FailRule(nextElementRuleId);
        break;
      }

      this.SucceedRule(nextElementRuleId);
      allElements.push(nextElement);
    } while (true);

    return allElements;
  };

  public PreProcessInputString(str: string): string {
    const commentEliminator = new CommentEliminator(str);
    return commentEliminator.Process();
  }

  public readonly CreateDebugMetadata = (
    stateAtStart: StringParserElement | null,
    stateAtEnd: StringParserElement
  ): DebugMetadata => {
    const md = new DebugMetadata();
    md.startLineNumber = (stateAtStart?.lineIndex || 0) + 1;
    md.endLineNumber = stateAtEnd.lineIndex + 1;
    md.startCharacterNumber = (stateAtStart?.characterInLineIndex || 0) + 1;
    md.endCharacterNumber = stateAtEnd.characterInLineIndex + 1;
    md.fileName = this._filename;

    return md;
  };

  public readonly RuleDidSucceed = (
    result: ParseRuleReturn,
    stateAtStart: StringParserElement | null,
    stateAtEnd: StringParserElement
  ): void => {
    // Apply DebugMetadata based on the state at the start of the rule
    // (i.e. use line number as it was at the start of the rule)
    const parsedObj = asOrNull(result, ParsedObject);
    if (parsedObj) {
      parsedObj.debugMetadata = this.CreateDebugMetadata(
        stateAtStart,
        stateAtEnd
      );
    }

    // A list of objects that doesn't already have metadata?
    const parsedListObjs: ParsedObject[] | null = Array.isArray(result)
      ? (result as ParsedObject[])
      : null;
    if (parsedListObjs !== null) {
      for (const parsedListObj of parsedListObjs) {
        const singleObj = asOrNull(parsedListObj, ParsedObject);
        if (!singleObj) continue;
        if (!parsedListObj.hasOwnDebugMetadata) {
          parsedListObj.debugMetadata = this.CreateDebugMetadata(
            stateAtStart,
            stateAtEnd
          );
        }
      }
    }

    const id = asOrNull(result, Identifier);
    if (id != null) {
      id.debugMetadata = this.CreateDebugMetadata(stateAtStart, stateAtEnd);
    }
  };

  get parsingStringExpression(): boolean {
    return this.GetFlag(Number(CustomFlags.ParsingString));
  }

  set parsingStringExpression(value: boolean) {
    this.SetFlag(Number(CustomFlags.ParsingString), value);
  }

  get tagActive(): boolean {
    return this.GetFlag(Number(CustomFlags.TagActive));
  }

  set tagActive(value: boolean) {
    this.SetFlag(Number(CustomFlags.TagActive), value);
  }

  public readonly OnStringParserError = (
    message: string,
    index: number,
    lineIndex: number = 0,
    isWarning: boolean = false
  ): void => {
    const warningType: string = isWarning ? "WARNING:" : "ERROR:";
    let fullMessage: string = warningType;

    if (this._filename !== null) {
      fullMessage += ` '${this._filename}'`;
    }

    fullMessage += ` line ${lineIndex + 1}: ${message}`;

    if (this._externalErrorHandler !== null) {
      this._externalErrorHandler(
        fullMessage,
        isWarning ? ErrorType.Warning : ErrorType.Error
      );
    } else {
      throw new Error(fullMessage);
    }
  };

  public readonly AuthorWarning = (): AuthorWarning | null => {
    this.Whitespace();

    const identifier = this.Parse(
      this.IdentifierWithMetadata
    ) as unknown as Identifier | null;
    if (identifier === null || identifier.name !== "TODO") {
      return null;
    }

    this.Whitespace();
    this.ParseString(":");
    this.Whitespace();

    const message = this.ParseUntilCharactersFromString("\n\r");

    if (message) {
      return new AuthorWarning(message);
    }

    return null;
  };

  /**
   * End base InkParser section.
   */

  /**
   * Begin CharacterRanges section.
   */

  public static readonly LatinBasic: CharacterRange = CharacterRange.Define(
    "\u0041",
    "\u007A",
    new CharacterSet().AddRange("\u005B", "\u0060")
  );

  public static readonly LatinExtendedA: CharacterRange = CharacterRange.Define(
    "\u0100",
    "\u017F"
    // no excludes here
  );

  public static readonly LatinExtendedB: CharacterRange = CharacterRange.Define(
    "\u0180",
    "\u024F"
    // no excludes here
  );

  public static readonly Greek: CharacterRange = CharacterRange.Define(
    "\u0370",
    "\u03FF",
    new CharacterSet()
      .AddRange("\u0378", "\u0385")
      .AddCharacters("\u0374\u0375\u0378\u0387\u038B\u038D\u03A2")
  );

  public static readonly Cyrillic: CharacterRange = CharacterRange.Define(
    "\u0400",
    "\u04FF",
    new CharacterSet().AddRange("\u0482", "\u0489")
  );

  public static readonly Armenian: CharacterRange = CharacterRange.Define(
    "\u0530",
    "\u058F",
    new CharacterSet()
      .AddCharacters("\u0530")
      .AddRange("\u0557", "\u0560")
      .AddRange("\u0588", "\u058E")
  );

  public static readonly Hebrew: CharacterRange = CharacterRange.Define(
    "\u0590",
    "\u05FF",
    new CharacterSet()
  );

  public static readonly Arabic: CharacterRange = CharacterRange.Define(
    "\u0600",
    "\u06FF",
    new CharacterSet()
  );

  public static readonly Korean: CharacterRange = CharacterRange.Define(
    "\uAC00",
    "\uD7AF",
    new CharacterSet()
  );

  public static readonly Latin1Supplement: CharacterRange =
    CharacterRange.Define("\u0080", "\u00FF", new CharacterSet());

  public static readonly Chinese: CharacterRange = CharacterRange.Define(
    "\u4E00",
    "\u9FFF",
    new CharacterSet()
  );

  private readonly ExtendIdentifierCharacterRanges = (
    identifierCharSet: CharacterSet
  ): void => {
    const characterRanges = InkParser.ListAllCharacterRanges();
    for (const charRange of characterRanges) {
      identifierCharSet.AddCharacters(charRange.ToCharacterSet());
    }
  };

  /// <summary>
  /// Gets an array of <see cref="CharacterRange" /> representing all of the currently supported
  /// non-ASCII character ranges that can be used in identifier names.
  /// </summary>
  /// <returns>
  /// An array of <see cref="CharacterRange" /> representing all of the currently supported
  /// non-ASCII character ranges that can be used in identifier names.
  /// </returns>
  public static readonly ListAllCharacterRanges = (): CharacterRange[] => [
    InkParser.LatinBasic,
    InkParser.LatinExtendedA,
    InkParser.LatinExtendedB,
    InkParser.Arabic,
    InkParser.Armenian,
    InkParser.Cyrillic,
    InkParser.Greek,
    InkParser.Hebrew,
    InkParser.Korean,
    InkParser.Latin1Supplement,
    InkParser.Chinese,
  ];

  /**
   * End CharacterRanges section.
   */

  /**
   * Begin Choices section.
   */

  public _parsingChoice: boolean = false;

  public readonly Choice = (): Choice | null => {
    let onceOnlyChoice: boolean = true;
    let bullets = this.Interleave<string>(
      this.OptionalExclude(this.Whitespace),
      this.String("*")
    );

    if (!bullets) {
      bullets = this.Interleave<string>(
        this.OptionalExclude(this.Whitespace),
        this.String("+")
      );

      if (bullets === null) {
        return null;
      }

      onceOnlyChoice = false;
    }

    // Optional name for the choice
    const optionalName: Identifier = this.Parse(
      this.BracketedName
    ) as Identifier;

    this.Whitespace();

    // Allow optional newline right after a choice name
    if (optionalName != null) this.Newline();

    // Optional condition for whether the choice should be shown to the player
    const conditionExpr: Expression = this.Parse(
      this.ChoiceCondition
    ) as Expression;

    this.Whitespace();

    // Ordinarily we avoid parser state variables like these, since
    // nesting would require us to store them in a stack. But since you should
    // never be able to nest choices within choice content, it's fine here.
    if (this._parsingChoice) {
      throw new Error(
        "Already parsing a choice - shouldn't have nested choices"
      );
    }

    this._parsingChoice = true;

    let startContent: ContentList | null = null;
    const startTextAndLogic = this.Parse(
      this.MixedTextAndLogic
    ) as ParsedObject[];
    if (startTextAndLogic) {
      startContent = new ContentList(startTextAndLogic);
    }

    let optionOnlyContent: ContentList | null = null;
    let innerContent: ContentList | null = null;

    // Check for a the weave style format:
    //   * "Hello[."]," he said.
    const hasWeaveStyleInlineBrackets: boolean = this.ParseString("[") !== null;
    if (hasWeaveStyleInlineBrackets) {
      this.EndTagIfNecessary(startContent);

      const optionOnlyTextAndLogic = this.Parse(
        this.MixedTextAndLogic
      ) as ParsedObject[];

      if (optionOnlyTextAndLogic !== null) {
        optionOnlyContent = new ContentList(optionOnlyTextAndLogic);
      }

      this.Expect(this.String("]"), "closing ']' for weave-style option");

      this.EndTagIfNecessary(optionOnlyContent);

      let innerTextAndLogic = this.Parse(
        this.MixedTextAndLogic
      ) as ParsedObject[];
      if (innerTextAndLogic !== null) {
        innerContent = new ContentList(innerTextAndLogic);
      }
    }

    this.Whitespace();

    this.EndTagIfNecessary(innerContent ?? startContent);

    // Finally, now we know we're at the end of the main choice body, parse
    // any diverts separately.
    const diverts: ParsedObject[] = this.Parse(
      this.MultiDivert
    ) as ParsedObject[];

    this._parsingChoice = false;

    this.Whitespace();

    // Completely empty choice without even an empty divert?
    const emptyContent: boolean =
      !startContent && !innerContent && !optionOnlyContent;

    if (emptyContent && diverts === null) {
      this.Warning(
        "Choice is completely empty. Interpretting as a default fallback choice. Add a divert arrow to remove this warning: * ->"
      );
    }

    if (!startContent && hasWeaveStyleInlineBrackets && !optionOnlyContent) {
      // * [] some text
      this.Warning(
        "Blank choice - if you intended a default fallback choice, use the `* ->` syntax"
      );
    }

    if (!innerContent) {
      innerContent = new ContentList();
    }

    this.EndTagIfNecessary(innerContent);

    // Normal diverts on the end of a choice - simply add to the normal content
    if (diverts !== null) {
      for (const divObj of diverts) {
        // may be TunnelOnwards
        const div = asOrNull(divObj, Divert);

        // Empty divert serves no purpose other than to say
        // "this choice is intentionally left blank"
        // (as an invisible default choice)
        if (div && div.isEmpty) {
          continue;
        }

        innerContent.AddContent(divObj);
      }
    }

    // Terminate main content with a newline since this is the end of the line
    // Note that this will be redundant if the diverts above definitely take
    // the flow away permanently.
    innerContent.AddContent(new Text("\n"));

    const choice = new Choice(startContent!, optionOnlyContent!, innerContent);
    if (optionalName) choice.identifier = optionalName;
    choice.indentationDepth = bullets.length;
    choice.hasWeaveStyleInlineBrackets = hasWeaveStyleInlineBrackets;
    choice.condition = conditionExpr;
    choice.onceOnly = onceOnlyChoice;
    choice.isInvisibleDefault = emptyContent;
    return choice;
  };

  public readonly ChoiceCondition = (): Expression | null => {
    const conditions = this.Interleave<Expression>(
      this.ChoiceSingleCondition,
      this.ChoiceConditionsSpace
    );

    if (conditions === null) {
      return null;
    } else if (conditions.length === 1) {
      return conditions[0];
    }

    return new MultipleConditionExpression(conditions);
  };

  public readonly ChoiceConditionsSpace = (): typeof ParseSuccess => {
    // Both optional
    // Newline includes initial end of line whitespace
    this.Newline();
    this.Whitespace();

    return ParseSuccess;
  };

  public readonly ChoiceSingleCondition = (): Expression | null => {
    if (this.ParseString("{") === null) {
      return null;
    }

    const condExpr = this.Expect(
      this.Expression,
      "choice condition inside { }"
    ) as Expression;

    this.DisallowIncrement(condExpr);
    this.Expect(this.String("}"), "closing '}' for choice condition");

    return condExpr;
  };

  public readonly Gather = (): Gather | null => {
    const gatherDashCountObj: number = this.Parse(this.GatherDashes) as number;
    if (gatherDashCountObj === null) {
      return null;
    }

    const gatherDashCount: number = Number(gatherDashCountObj);

    // Optional name for the gather
    const optionalName: Identifier = this.Parse(
      this.BracketedName
    ) as Identifier;

    const gather = new Gather(optionalName, gatherDashCount);

    // Optional newline before gather's content begins
    this.Newline();

    return gather;
  };

  public readonly GatherDashes = (): number | null => {
    this.Whitespace();

    let gatherDashCount: number = 0;
    while (this.ParseDashNotArrow() !== null) {
      gatherDashCount += 1;
      this.Whitespace();
    }

    if (gatherDashCount === 0) {
      return null;
    }

    return gatherDashCount as number;
  };

  public readonly ParseDashNotArrow = () => {
    const ruleId = this.BeginRule();

    if (
      this.ParseString("->") === null &&
      this.ParseSingleCharacter() === "-"
    ) {
      return this.SucceedRule(ruleId);
    }

    return this.FailRule(ruleId);
  };

  public readonly BracketedName = (): Identifier | null => {
    if (this.ParseString("(") === null) {
      return null;
    }

    this.Whitespace();

    const name = this.Parse(this.IdentifierWithMetadata) as Identifier | null;
    if (name === null) {
      return null;
    }

    this.Whitespace();

    this.Expect(this.String(")"), "closing ')' for bracketed name");

    return name;
  };

  /**
   * End Choices section.
   */

  /**
   * Begin Conditional section.
   */

  public readonly InnerConditionalContent = (
    initialQueryExpression: Expression
  ): Conditional | null => {
    if (initialQueryExpression === undefined) {
      const initialQueryExpression = this.Parse(this.ConditionExpression);
      const conditional = this.Parse(() =>
        this.InnerConditionalContent(initialQueryExpression as Expression)
      ) as Conditional;

      if (conditional === null) {
        return null;
      }

      return conditional;
    }

    let alternatives: ConditionalSingleBranch[] | null;
    const canBeInline: boolean = initialQueryExpression !== null;
    const isInline: boolean = this.Parse(this.Newline) === null;

    if (isInline && !canBeInline) {
      return null;
    }

    if (isInline) {
      // Inline innards
      alternatives = this.InlineConditionalBranches();
    } else {
      // Multiline innards
      alternatives = this.MultilineConditionalBranches();

      if (alternatives === null) {
        // Allow single piece of content within multi-line expression, e.g.:
        // { true:
        //    Some content that isn't preceded by '-'
        // }
        if (initialQueryExpression) {
          let soleContent: ParsedObject[] = this.StatementsAtLevel(
            StatementLevel.InnerBlock
          );
          if (soleContent !== null) {
            const soleBranch = new ConditionalSingleBranch(soleContent);
            alternatives = [soleBranch];

            // Also allow a final "- else:" clause
            const elseBranch = this.Parse(
              this.SingleMultilineCondition
            ) as ConditionalSingleBranch;
            if (elseBranch) {
              if (!elseBranch.isElse) {
                this.ErrorWithParsedObject(
                  "Expected an '- else:' clause here rather than an extra condition",
                  elseBranch
                );

                elseBranch.isElse = true;
              }

              alternatives.push(elseBranch);
            }
          }
        }

        // Still null?
        if (alternatives === null) {
          return null;
        }
      } else if (
        alternatives.length === 1 &&
        alternatives[0].isElse &&
        initialQueryExpression
      ) {
        // Empty true branch - didn't get parsed, but should insert one for semantic correctness,
        // and to make sure that any evaluation stack values get tidied up correctly.
        const emptyTrueBranch = new ConditionalSingleBranch(null);
        emptyTrueBranch.isTrueBranch = true;
        alternatives.unshift(emptyTrueBranch);
      }

      // Like a switch statement
      // { initialQueryExpression:
      //    ... match the expression
      // }
      if (initialQueryExpression) {
        let earlierBranchesHaveOwnExpression: boolean = false;
        for (let ii = 0; ii < alternatives.length; ++ii) {
          const branch = alternatives[ii];
          const isLast: boolean = ii === alternatives.length - 1;

          // Matching equality with initial query expression
          // We set this flag even for the "else" clause so that
          // it knows to tidy up the evaluation stack at the end

          // Match query
          if (branch.ownExpression) {
            branch.matchingEquality = true;
            earlierBranchesHaveOwnExpression = true;
          } else if (earlierBranchesHaveOwnExpression && isLast) {
            // Else (final branch)
            branch.matchingEquality = true;
            branch.isElse = true;
          } else {
            // Binary condition:
            // { trueOrFalse:
            //    - when true
            //    - when false
            // }
            if (!isLast && alternatives.length > 2) {
              this.ErrorWithParsedObject(
                "Only final branch can be an 'else'. Did you miss a ':'?",
                branch
              );
            } else {
              if (ii === 0) {
                branch.isTrueBranch = true;
              } else {
                branch.isElse = true;
              }
            }
          }
        }
      } else {
        // No initial query, so just a multi-line conditional. e.g.:
        // {
        //   - x > 3:  greater than three
        //   - x == 3: equal to three
        //   - x < 3:  less than three
        // }

        for (let ii = 0; ii < alternatives.length; ++ii) {
          const alt = alternatives[ii];
          const isLast: boolean = ii === alternatives.length - 1;

          if (alt.ownExpression === null) {
            if (isLast) {
              alt.isElse = true;
            } else {
              if (alt.isElse) {
                // Do we ALSO have a valid "else" at the end? Let's report the error there.
                const finalClause = alternatives[alternatives.length - 1];
                if (finalClause.isElse) {
                  this.ErrorWithParsedObject(
                    "Multiple 'else' cases. Can have a maximum of one, at the end.",
                    finalClause
                  );
                } else {
                  this.ErrorWithParsedObject(
                    "'else' case in conditional should always be the final one",
                    alt
                  );
                }
              } else {
                this.ErrorWithParsedObject(
                  "Branch doesn't have condition. Are you missing a ':'? ",
                  alt
                );
              }
            }
          }
        }

        if (
          alternatives.length === 1 &&
          alternatives[0].ownExpression === null
        ) {
          this.ErrorWithParsedObject(
            "Condition block with no conditions",
            alternatives[0]
          );
        }
      }
    }

    // TODO: Come up with water-tight error conditions... it's quite a flexible system!
    // e.g.
    //   - inline conditionals must have exactly 1 or 2 alternatives
    //   - multiline expression shouldn't have mixed existence of branch-conditions?
    if (alternatives === null) {
      return null;
    }

    for (const branch of alternatives) {
      branch.isInline = isInline;
    }

    const cond = new Conditional(initialQueryExpression, alternatives);

    return cond;
  };

  public readonly InlineConditionalBranches = ():
    | ConditionalSingleBranch[]
    | null => {
    const listOfLists = this.Interleave<ParsedObject[]>(
      this.MixedTextAndLogic,
      this.Exclude(this.String("|")),
      null,
      false
    );

    if (listOfLists === null || listOfLists.length === 0) {
      return null;
    }

    const result: ConditionalSingleBranch[] = [];

    if (listOfLists.length > 2) {
      this.Error(
        "Expected one or two alternatives separated by '|' in inline conditional"
      );
    } else {
      const trueBranch = new ConditionalSingleBranch(listOfLists[0]);
      trueBranch.isTrueBranch = true;
      result.push(trueBranch);

      if (listOfLists.length > 1) {
        const elseBranch = new ConditionalSingleBranch(listOfLists[1]);
        elseBranch.isElse = true;
        result.push(elseBranch);
      }
    }

    return result;
  };

  public readonly MultilineConditionalBranches = ():
    | ConditionalSingleBranch[]
    | null => {
    this.MultilineWhitespace();

    const multipleConditions = this.OneOrMore(this.SingleMultilineCondition);
    if (multipleConditions === null) {
      return null;
    }

    this.MultilineWhitespace();

    return multipleConditions as ConditionalSingleBranch[];
  };

  public readonly SingleMultilineCondition =
    (): ConditionalSingleBranch | null => {
      this.Whitespace();

      if (
        // Make sure we're not accidentally parsing a divert
        this.ParseString("->") !== null ||
        this.ParseString("-") === null
      ) {
        return null;
      }

      this.Whitespace();

      let expr: Expression | null = null;
      const isElse: boolean = this.Parse(this.ElseExpression) !== null;

      if (!isElse) {
        expr = this.Parse(this.ConditionExpression) as Expression;
      }

      let content: ParsedObject[] = this.StatementsAtLevel(
        StatementLevel.InnerBlock
      );
      if (expr === null && content === null) {
        this.Error("expected content for the conditional branch following '-'");

        // Recover
        content = [new Text("")];
      }

      // Allow additional multiline whitespace, if the statements were empty (valid)
      // then their surrounding multiline whitespacce needs to be handled manually.
      // e.g.
      // { x:
      //   - 1:    // intentionally left blank, but newline needs to be parsed
      //   - 2: etc
      // }
      this.MultilineWhitespace();

      const branch = new ConditionalSingleBranch(content);
      branch.ownExpression = expr;
      branch.isElse = isElse;

      return branch;
    };

  public readonly ConditionExpression = (): ParsedObject | null => {
    const expr = this.Parse(this.Expression) as ParsedObject;
    if (expr === null) {
      return null;
    }

    this.DisallowIncrement(expr);

    this.Whitespace();

    if (this.ParseString(":") === null) {
      return null;
    }

    return expr;
  };

  public readonly ElseExpression = (): typeof ParseSuccess | null => {
    if (this.ParseString("else") === null) {
      return null;
    }

    this.Whitespace();

    if (this.ParseString(":") === null) {
      return null;
    }

    return ParseSuccess;
  };

  /**
   * End Conditional section.
   */

  /**
   * Begin Content section.
   */

  public _nonTextPauseCharacters: CharacterSet | null = null;
  public _nonTextEndCharacters: CharacterSet | null = null;
  public _notTextEndCharactersChoice: CharacterSet | null = null;
  public _notTextEndCharactersString: CharacterSet | null = null;

  public readonly TrimEndWhitespace = (
    mixedTextAndLogicResults: ParsedObject[],
    terminateWithSpace: boolean
  ): void => {
    // Trim whitespace from end
    if (mixedTextAndLogicResults.length > 0) {
      const lastObjIdx = mixedTextAndLogicResults.length - 1;
      const lastObj = mixedTextAndLogicResults[lastObjIdx];
      if (lastObj instanceof Text) {
        const textObj: Text = lastObj;
        textObj.text = textObj.text.replace(new RegExp(/[ \t]+$/g), "");

        if (terminateWithSpace) {
          textObj.text += " ";
        } else if (textObj.text.length === 0) {
          // No content left at all? trim the whole object
          mixedTextAndLogicResults.splice(lastObjIdx, 1);

          // Recurse in case there's more whitespace
          this.TrimEndWhitespace(mixedTextAndLogicResults, false);
        }
      }
    }
  };

  public readonly LineOfMixedTextAndLogic = (): ParsedObject[] | null => {
    // Consume any whitespace at the start of the line
    // (Except for escaped whitespace)
    this.Parse(this.Whitespace);

    let result: ParsedObject[] = this.Parse(
      this.MixedTextAndLogic
    ) as ParsedObject[];

    if (!result || !result.length) {
      return null;
    }

    // Warn about accidentally writing "return" without "~"
    const firstText = result[0] as Text;
    if (firstText && firstText.text && firstText.text.startsWith("return")) {
      this.Warning(
        "Do you need a '~' before 'return'? If not, perhaps use a glue: <> (since it's lowercase) or rewrite somehow?"
      );
    }

    if (result.length === 0) {
      return null;
    }

    const lastObj = result[result.length - 1];
    if (!(lastObj instanceof Divert)) {
      this.TrimEndWhitespace(result, false);
    }

    this.EndTagIfNecessary(result);

    // If the line doens't actually contain any normal text content
    // but is in fact entirely a tag, then let's not append
    // a newline, since we want the tag (or tags) to be associated
    // with the line below rather than being completely independent.
    let lineIsPureTag =
      result.length > 0 && result[0] instanceof Tag && result[0].isStart;

    if (!lineIsPureTag) {
      result.push(new Text("\n"));
    }

    this.Expect(this.EndOfLine, "end of line", this.SkipToNextLine);
    return result;
  };

  public readonly MixedTextAndLogic = (): ParsedObject[] | null => {
    // Check for disallowed "~" within this context
    const disallowedTilde = this.ParseObject(this.Spaced(this.String("~")));
    if (disallowedTilde !== null) {
      this.Error(
        "You shouldn't use a '~' here - tildas are for logic that's on its own line. To do inline logic, use { curly braces } instead"
      );
    }

    // Either, or both interleaved
    let results: ParsedObject[] = this.Interleave<ParsedObject>(
      this.Optional(this.ContentText),
      this.Optional(this.InlineLogicOrGlueOrStartTag)
    );

    // Terminating divert?
    // (When parsing content for the text of a choice, diverts aren't allowed.
    //  The divert on the end of the body of a choice is handled specially.)
    if (!this._parsingChoice) {
      const diverts: ParsedObject[] = this.Parse(
        this.MultiDivert
      ) as ParsedObject[];
      if (diverts !== null) {
        // May not have had any results at all if there's *only* a divert!
        if (results === null) {
          results = [];
        }

        // End previously active tag if necessary
        this.EndTagIfNecessary(results);

        this.TrimEndWhitespace(results, true);

        results.push(...diverts);
      }
    }

    if (!results) {
      return null;
    }

    return results;
  };

  public readonly ContentText = () => {
    return this.ContentTextAllowingEscapeChar();
  };

  public readonly ContentTextAllowingEscapeChar = (): Text | null => {
    let sb: string | null = null;

    do {
      let str = this.Parse(this.ContentTextNoEscape);
      const gotEscapeChar: boolean = this.ParseString("\\") !== null;

      if (gotEscapeChar || str !== null) {
        if (sb === null) {
          sb = "";
        }

        if (str !== null) {
          sb += String(str);
        }

        if (gotEscapeChar) {
          const c: string = this.ParseSingleCharacter();
          sb += c;
        }
      } else {
        break;
      }
    } while (true);

    if (sb !== null) {
      return new Text(sb);
    }

    return null;
  };

  // Content text is an unusual parse rule compared with most since it's
  // less about saying "this is is the small selection of stuff that we parse"
  // and more "we parse ANYTHING except this small selection of stuff".
  public readonly ContentTextNoEscape = (): string | null => {
    // Eat through text, pausing at the following characters, and
    // attempt to parse the nonTextRule.
    // "-": possible start of divert or start of gather
    // "<": possible start of glue
    if (this._nonTextPauseCharacters === null) {
      this._nonTextPauseCharacters = new CharacterSet("-<");
    }

    // If we hit any of these characters, we stop *immediately* without bothering to even check the nonTextRule
    // "{" for start of logic
    // "|" for mid logic branch
    if (this._nonTextEndCharacters === null) {
      this._nonTextEndCharacters = new CharacterSet("{}|\n\r\\#");
      this._notTextEndCharactersChoice = new CharacterSet(
        this._nonTextEndCharacters
      );
      this._notTextEndCharactersChoice.AddCharacters("[]");
      this._notTextEndCharactersString = new CharacterSet(
        this._nonTextEndCharacters
      );
      this._notTextEndCharactersString.AddCharacters('"');
    }

    // When the ParseUntil pauses, check these rules in case they evaluate successfully
    const nonTextRule: ParseRule = () =>
      this.OneOf([
        this.ParseDivertArrow,
        this.ParseThreadArrow,
        this.EndOfLine,
        this.Glue,
      ]);

    let endChars: CharacterSet | null = null;
    if (this.parsingStringExpression) {
      endChars = this._notTextEndCharactersString;
    } else if (this._parsingChoice) {
      endChars = this._notTextEndCharactersChoice;
    } else {
      endChars = this._nonTextEndCharacters;
    }

    const pureTextContent: string = this.ParseUntil(
      nonTextRule,
      this._nonTextPauseCharacters,
      endChars
    );

    if (pureTextContent !== null) {
      return pureTextContent;
    }

    return null;
  };

  /**
   * End Content section.
   */

  /**
   * Begin Divert section.
   */

  public readonly MultiDivert = (): ParsedObject[] | null => {
    this.Whitespace();

    let diverts: ParsedObject[] = [];

    // Try single thread first
    const threadDivert = this.Parse(this.StartThread) as ParsedObject;
    if (threadDivert) {
      diverts = [threadDivert];

      return diverts;
    }

    // Normal diverts and tunnels
    const arrowsAndDiverts = this.Interleave<ParsedObject>(
      this.ParseDivertArrowOrTunnelOnwards,
      this.DivertIdentifierWithArguments
    );

    if (!arrowsAndDiverts) {
      return null;
    }

    diverts = [];

    this.EndTagIfNecessary(diverts);

    // Possible patterns:
    //  ->                   -- explicit gather
    //  ->->                 -- tunnel onwards
    //  -> div               -- normal divert
    //  ->-> div             -- tunnel onwards, followed by override divert
    //  -> div ->            -- normal tunnel
    //  -> div ->->          -- tunnel then tunnel continue
    //  -> div -> div        -- tunnel then divert
    //  -> div -> div ->     -- tunnel then tunnel
    //  -> div -> div ->->
    //  -> div -> div ->-> div    (etc)

    // Look at the arrows and diverts
    for (let ii = 0; ii < arrowsAndDiverts.length; ++ii) {
      const isArrow: boolean = ii % 2 === 0;

      // Arrow string
      if (isArrow) {
        // Tunnel onwards
        if ((arrowsAndDiverts[ii] as any) === "->->") {
          const tunnelOnwardsPlacementValid: boolean =
            ii === 0 ||
            ii === arrowsAndDiverts.length - 1 ||
            ii === arrowsAndDiverts.length - 2;

          if (!tunnelOnwardsPlacementValid) {
            this.Error(
              "Tunnel onwards '->->' must only come at the begining or the start of a divert"
            );
          }

          const tunnelOnwards = new TunnelOnwards();
          if (ii < arrowsAndDiverts.length - 1) {
            const tunnelOnwardDivert = asOrNull(
              arrowsAndDiverts[ii + 1],
              Divert
            );
            tunnelOnwards.divertAfter = tunnelOnwardDivert;
          }

          diverts.push(tunnelOnwards);

          // Not allowed to do anything after a tunnel onwards.
          // If we had anything left it would be caused in the above Error for
          // the positioning of a ->->
          break;
        }
      } else {
        // Divert
        const divert = arrowsAndDiverts[ii] as Divert;
        // More to come? (further arrows) Must be tunnelling.
        if (ii < arrowsAndDiverts.length - 1) {
          divert.isTunnel = true;
        }

        diverts.push(divert);
      }
    }

    // Single -> (used for default choices)
    if (diverts.length === 0 && arrowsAndDiverts.length === 1) {
      const gatherDivert = new Divert(null);
      gatherDivert.isEmpty = true;
      diverts.push(gatherDivert);

      if (!this._parsingChoice) {
        this.Error("Empty diverts (->) are only valid on choices");
      }
    }

    return diverts;
  };

  public readonly StartThread = (): Divert | null => {
    this.Whitespace();

    if (this.ParseThreadArrow() === null) {
      return null;
    }

    this.Whitespace();

    const divert = this.Expect(
      this.DivertIdentifierWithArguments,
      "target for new thread",
      () => new Divert(null)
    ) as Divert;

    divert.isThread = true;

    return divert;
  };

  public readonly DivertIdentifierWithArguments = (): Divert | null => {
    this.Whitespace();

    const targetComponents: Identifier[] = this.Parse(
      this.DotSeparatedDivertPathComponents
    ) as Identifier[];

    if (!targetComponents) {
      return null;
    }

    this.Whitespace();

    const optionalArguments = this.Parse(
      this.ExpressionFunctionCallArguments
    ) as Expression[];

    this.Whitespace();

    const targetPath = new Path(targetComponents);

    return new Divert(targetPath, optionalArguments);
  };

  public readonly SingleDivert = (): Divert | null => {
    const diverts = this.Parse(this.MultiDivert) as ParsedObject[];
    if (!diverts) {
      return null;
    }

    // Ideally we'd report errors if we get the
    // wrong kind of divert, but unfortunately we
    // have to hack around the fact that sequences use
    // a very similar syntax.
    // i.e. if you have a multi-divert at the start
    // of a sequence, it initially tries to parse it
    // as a divert target (part of an expression of
    // a conditional) and gives errors. So instead
    // we just have to blindly reject it as a single
    // divert, and give a slightly less nice error
    // when you DO use a multi divert as a divert taret.

    if (diverts.length !== 1) {
      return null;
    }

    const singleDivert = diverts[0];
    if (singleDivert instanceof TunnelOnwards) {
      return null;
    }

    const divert = diverts[0] as Divert;
    if (divert.isTunnel) {
      return null;
    }

    return divert;
  };

  public readonly DotSeparatedDivertPathComponents = (): Identifier[] =>
    this.Interleave<Identifier>(
      this.Spaced(this.IdentifierWithMetadata),
      this.Exclude(this.String("."))
    );

  public readonly ParseDivertArrowOrTunnelOnwards = (): string | null => {
    let numArrows: number = 0;
    while (this.ParseString("->") !== null) {
      numArrows += 1;
    }

    if (numArrows === 0) {
      return null;
    } else if (numArrows === 1) {
      return "->";
    } else if (numArrows === 2) {
      return "->->";
    }

    this.Error(
      "Unexpected number of arrows in divert. Should only have '->' or '->->'"
    );

    return "->->";
  };

  public readonly ParseDivertArrow = () => this.ParseString("->");

  public readonly ParseThreadArrow = () => this.ParseString("<-");

  /**
   * End Divert section.
   */

  /**
   * Begin Expressions section.
   */

  public _binaryOperators: InfixOperator[] = [];
  public _maxBinaryOpLength: number = 0;

  public readonly TempDeclarationOrAssignment = (): ParsedObject | null => {
    this.Whitespace();

    const isNewDeclaration: boolean = this.ParseTempKeyword();

    this.Whitespace();

    let varIdentifier: Identifier | null = null;
    if (isNewDeclaration) {
      varIdentifier = this.Expect(
        this.IdentifierWithMetadata,
        "variable name"
      ) as Identifier;
    } else {
      varIdentifier = this.Parse(this.IdentifierWithMetadata) as Identifier;
    }

    if (varIdentifier === null) {
      return null;
    }

    this.Whitespace();

    // += -=
    const isIncrement: boolean = this.ParseString("+") !== null;
    const isDecrement: boolean = this.ParseString("-") !== null;

    if (isIncrement && isDecrement) {
      this.Error("Unexpected sequence '+-'");
    }

    if (this.ParseString("=") === null) {
      // Definitely in an assignment expression?
      if (isNewDeclaration) {
        this.Error("Expected '='");
      }

      return null;
    }

    const assignedExpression: Expression = this.Expect(
      this.Expression,
      "value expression to be assigned"
    ) as Expression;

    if (isIncrement || isDecrement) {
      const result = new IncDecExpression(
        varIdentifier,
        assignedExpression,
        isIncrement
      );
      return result;
    }

    const result = new VariableAssignment({
      variableIdentifier: varIdentifier,
      assignedExpression,
      isTemporaryNewDeclaration: isNewDeclaration,
    });

    return result;
  };

  public readonly DisallowIncrement = (expr: ParsedObject): void => {
    if (expr instanceof IncDecExpression) {
      this.Error(
        "Can't use increment/decrement here. It can only be used on a ~ line"
      );
    }
  };

  public readonly ParseTempKeyword = () => {
    const ruleId = this.BeginRule();

    if (this.Parse(this.Identifier) === "temp") {
      this.SucceedRule(ruleId);
      return true;
    }

    this.FailRule(ruleId);
    return false;
  };

  public readonly ReturnStatement = (): ReturnType | null => {
    this.Whitespace();

    const returnOrDone = this.Parse(this.Identifier);
    if (returnOrDone !== "return") {
      return null;
    }

    this.Whitespace();

    const expr = this.Parse(this.Expression) as Expression;

    const returnObj = new ReturnType(expr);

    return returnObj;
  };

  // Pratt Parser
  // aka "Top down operator precedence parser"
  // http://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/
  // Algorithm overview:
  // The two types of precedence are handled in two different ways:
  //   ((((a . b) . c) . d) . e)			#1
  //   (a . (b . (c . (d . e))))			#2
  // Where #1 is automatically handled by successive loops within the main 'while' in this function,
  // so long as continuing operators have lower (or equal) precedence (e.g. imagine some series of "*"s then "+" above.
  // ...and #2 is handled by recursion of the right hand term in the binary expression parser.
  // (see link for advice on how to extend for postfix and mixfix operators)
  public readonly Expression = (
    minimumPrecedence: number = 0
  ): Expression | null => {
    this.Whitespace();

    // First parse a unary expression e.g. "-a" or parethensised "(1 + 2)"
    let expr = this.ExpressionUnary();
    if (expr === null) {
      return null;
    }

    this.Whitespace();

    // Attempt to parse (possibly multiple) continuing infix expressions (e.g. 1 + 2 + 3)
    while (true) {
      const ruleId = this.BeginRule();

      // Operator
      const infixOp = this.ParseInfixOperator();
      if (infixOp !== null && infixOp.precedence > minimumPrecedence) {
        // Expect right hand side of operator
        const expectationMessage = `right side of '${infixOp.type}' expression`;
        const multiaryExpr = this.Expect(
          () => this.ExpressionInfixRight(expr, infixOp),
          expectationMessage
        );

        if (multiaryExpr === null) {
          // Fail for operator and right-hand side of multiary expression
          this.FailRule(ruleId);

          return null;
        }

        expr = this.SucceedRule(ruleId, multiaryExpr) as Expression;

        continue;
      }

      this.FailRule(ruleId);
      break;
    }

    this.Whitespace();

    return expr;
  };

  public readonly ExpressionUnary = (): Expression | null => {
    // Divert target is a special case - it can't have any other operators
    // applied to it, and we also want to check for it first so that we don't
    // confuse "->" for subtraction.
    const divertTarget = this.Parse(this.ExpressionDivertTarget) as Expression;
    if (divertTarget !== null) {
      return divertTarget;
    }

    let prefixOp: string = this.OneOf([
      this.String("-"),
      this.String("!"),
    ]) as string;

    // Don't parse like the string rules above, in case its actually
    // a variable that simply starts with "not", e.g. "notable".
    // This rule uses the Identifier rule, which will scan as much text
    // as possible before returning.
    if (prefixOp === null) {
      prefixOp = this.Parse(this.ExpressionNot) as string;
    }

    this.Whitespace();

    // - Since we allow numbers at the start of variable names, variable names are checked before literals
    // - Function calls before variable names in case we see parentheses
    let expr = this.OneOf([
      this.ExpressionList,
      this.ExpressionParen,
      this.ExpressionFunctionCall,
      this.ExpressionVariableName,
      this.ExpressionLiteral,
    ]) as Expression | null;

    // Only recurse immediately if we have one of the (usually optional) unary ops
    if (expr === null && prefixOp !== null) {
      expr = this.ExpressionUnary();
    }

    if (expr === null) {
      return null;
    } else if (prefixOp !== null) {
      expr = UnaryExpression.WithInner(expr, prefixOp) as Expression;
    }

    this.Whitespace();

    const postfixOp = this.OneOf([this.String("++"), this.String("--")]);

    if (postfixOp !== null) {
      const isInc: boolean = postfixOp === "++";

      if (!(expr instanceof VariableReference)) {
        this.Error(
          `can only increment and decrement variables, but saw '${expr}'.`
        );

        // Drop down and succeed without the increment after reporting error
      } else {
        const varRef = expr as VariableReference;
        expr = new IncDecExpression(varRef.identifier, isInc);
      }
    }

    return expr;
  };

  public readonly ExpressionNot = (): string | null => {
    const id = this.Identifier();
    if (id === "not") {
      return id;
    }

    return null;
  };

  public readonly ExpressionLiteral = (): Expression =>
    this.OneOf([
      this.ExpressionFloat,
      this.ExpressionInt,
      this.ExpressionBool,
      this.ExpressionString,
    ]) as Expression;

  public readonly ExpressionDivertTarget = (): Expression | null => {
    this.Whitespace();

    const divert = this.Parse(this.SingleDivert) as Divert;
    if (!divert || (divert && divert.isThread)) {
      return null;
    }

    this.Whitespace();

    return new DivertTarget(divert);
  };

  public readonly ExpressionInt = (): NumberExpression | null => {
    const intOrNull: number = this.ParseInt() as number;
    if (intOrNull === null) {
      return null;
    }

    return new NumberExpression(intOrNull, "int");
  };

  public readonly ExpressionFloat = (): NumberExpression | null => {
    const floatOrNull: number = this.ParseFloat() as number;
    if (floatOrNull === null) {
      return null;
    }

    return new NumberExpression(floatOrNull, "float");
  };

  public readonly ExpressionString = (): StringExpression | null => {
    const openQuote = this.ParseString('"');
    if (openQuote === null) {
      return null;
    }

    // Set custom parser state flag so that within the text parser,
    // it knows to treat the quote character (") as an end character
    this.parsingStringExpression = true;

    let textAndLogic: ParsedObject[] = this.Parse(
      this.MixedTextAndLogic
    ) as ParsedObject[];

    this.Expect(this.String('"'), "close quote for string expression");

    this.parsingStringExpression = false;

    if (textAndLogic === null) {
      textAndLogic = [new Text("")];
    } else if (textAndLogic.find((c) => c instanceof Divert)) {
      this.Error("String expressions cannot contain diverts (->)");
    }

    return new StringExpression(textAndLogic);
  };

  public readonly ExpressionBool = (): NumberExpression | null => {
    const id = this.Parse(this.Identifier);
    if (id === "true") {
      return new NumberExpression(true, "bool");
    } else if (id === "false") {
      return new NumberExpression(false, "bool");
    }

    return null;
  };

  public readonly ExpressionFunctionCall = (): Expression | null => {
    const iden = this.Parse(this.IdentifierWithMetadata);
    if (iden === null) {
      return null;
    }

    this.Whitespace();

    const args = this.Parse(
      this.ExpressionFunctionCallArguments
    ) as Expression[];
    if (args === null) {
      return null;
    }

    return new FunctionCall(iden as Identifier, args);
  };

  public readonly ExpressionFunctionCallArguments = (): Expression[] | null => {
    if (this.ParseString("(") === null) {
      return null;
    }

    // "Exclude" requires the rule to succeed, but causes actual comma string to be excluded from the list of results
    const commas: ParseRule = this.Exclude(this.String(","));
    let args = this.Interleave<Expression>(this.Expression, commas);
    if (args === null) {
      args = [];
    }

    this.Whitespace();

    this.Expect(this.String(")"), "closing ')' for function call");

    return args;
  };

  public readonly ExpressionVariableName = (): Expression | null => {
    const path = this.Interleave<Identifier>(
      this.IdentifierWithMetadata,
      this.Exclude(this.Spaced(this.String(".")))
    );

    if (path === null || Story.IsReservedKeyword(path[0].name)) {
      return null;
    }

    return new VariableReference(path);
  };

  public readonly ExpressionParen = (): Expression | null => {
    if (this.ParseString("(") === null) {
      return null;
    }

    const innerExpr = this.Parse(this.Expression) as Expression;
    if (innerExpr === null) {
      return null;
    }

    this.Whitespace();

    this.Expect(this.String(")"), "closing parenthesis ')' for expression");

    return innerExpr;
  };

  public readonly ExpressionInfixRight = (
    left: Expression | null,
    op: InfixOperator
  ) => {
    if (!left) {
      return null;
    }

    this.Whitespace();

    const right = this.Parse(() =>
      this.Expression(op.precedence)
    ) as Expression;
    if (right) {
      // We assume that the character we use for the operator's type is the same
      // as that used internally by e.g. Runtime.Expression.Add, Runtime.Expression.Multiply etc
      const expr = new BinaryExpression(left, right, op.type);
      return expr;
    }

    return null;
  };

  private readonly ParseInfixOperator = (): InfixOperator | null => {
    for (const op of this._binaryOperators) {
      const ruleId: number = this.BeginRule();

      if (this.ParseString(op.type) !== null) {
        if (op.requireWhitespace) {
          if (this.Whitespace() === null) {
            this.FailRule(ruleId);

            continue;
          }
        }

        return this.SucceedRule(ruleId, op) as InfixOperator;
      }

      this.FailRule(ruleId);
    }

    return null;
  };

  public readonly ExpressionList = (): List | null => {
    this.Whitespace();

    if (this.ParseString("(") === null) {
      return null;
    }

    this.Whitespace();

    // When list has:
    //  - 0 elements (null list) - this is okay, it's an empty list: "()"
    //  - 1 element - it could be confused for a single non-list related
    //    identifier expression in brackets, but this is a useless thing
    //    to do, so we reserve that syntax for a list with one item.
    //  - 2 or more elements - normal!
    const memberNames: Identifier[] = this.SeparatedList(
      this.ListMember,
      this.Spaced(this.String(","))
    ) as Identifier[];

    this.Whitespace();

    // May have failed to parse the inner list - the parentheses may
    // be for a normal expression
    if (this.ParseString(")") === null) {
      return null;
    }
    return new List(memberNames);
  };

  public readonly ListMember = (): Identifier | null => {
    this.Whitespace();

    let identifier: Identifier = this.Parse(
      this.IdentifierWithMetadata
    ) as Identifier;
    if (identifier === null) {
      return null;
    }

    const dot = this.ParseString(".");
    if (dot !== null) {
      const identifier2: Identifier = this.Expect(
        this.IdentifierWithMetadata,
        `element name within the set ${identifier}`
      ) as Identifier;

      identifier.name += `.${identifier2?.name}`;
    }

    this.Whitespace();

    return identifier;
  };

  public readonly RegisterExpressionOperators = () => {
    // These will be tried in order, so we need "<=" before "<"
    // for correctness

    this.RegisterBinaryOperator("&&", 1);
    this.RegisterBinaryOperator("||", 1);
    this.RegisterBinaryOperator("and", 1, true);
    this.RegisterBinaryOperator("or", 1, true);
    this.RegisterBinaryOperator("==", 2);
    this.RegisterBinaryOperator(">=", 2);
    this.RegisterBinaryOperator("<=", 2);
    this.RegisterBinaryOperator("<", 2);
    this.RegisterBinaryOperator(">", 2);
    this.RegisterBinaryOperator("!=", 2);

    // (apples, oranges) + cabbages has (oranges, cabbages) === true
    this.RegisterBinaryOperator("?", 3);
    this.RegisterBinaryOperator("has", 3, true);
    this.RegisterBinaryOperator("!?", 3);
    this.RegisterBinaryOperator("hasnt", 3, true);
    this.RegisterBinaryOperator("^", 3);

    this.RegisterBinaryOperator("+", 4);
    this.RegisterBinaryOperator("-", 5);
    this.RegisterBinaryOperator("*", 6);
    this.RegisterBinaryOperator("/", 7);

    this.RegisterBinaryOperator("%", 8);
    this.RegisterBinaryOperator("mod", 8, true);
  };

  public readonly RegisterBinaryOperator = (
    op: string,
    precedence: number,
    requireWhitespace: boolean = false
  ): void => {
    const infix = new InfixOperator(op, precedence, requireWhitespace);
    this._binaryOperators.push(infix);
    this._maxBinaryOpLength = Math.max(this._maxBinaryOpLength, op.length);
  };

  /**
   * End Expressions section.
   */

  /**
   * Begin Include section.
   */

  private _rootParser: InkParser;
  private _openFilenames: string[] = [];

  public readonly IncludeStatement = () => {
    this.Whitespace();

    if (this.ParseString("INCLUDE") === null) {
      return null;
    }

    this.Whitespace();

    let filename: string = this.Expect(
      () => this.ParseUntilCharactersFromString("\n\r"),
      "filename for include statement"
    ) as string;

    filename = filename.replace(new RegExp(/[ \t]+$/g), "");

    // Working directory should already have been set up relative to the root ink file.
    const fullFilename = this.fileHandler.ResolveInkFilename(filename);

    if (this.FilenameIsAlreadyOpen(fullFilename)) {
      this.Error(
        `Recursive INCLUDE detected: '${fullFilename}' is already open.`
      );
      this.ParseUntilCharactersFromString("\r\n");
      return new IncludedFile(null);
    } else {
      this.AddOpenFilename(fullFilename);
    }

    let includedStory: Story | null = null;
    let includedString: string = "";
    try {
      includedString =
        this._rootParser.fileHandler.LoadInkFileContents(fullFilename);
    } catch (err) {
      this.Error(`Failed to load: '${filename}'.\nError:${err}`);
    }

    if (includedString != null) {
      const parser: InkParser = new InkParser(
        includedString,
        filename,
        this._externalErrorHandler,
        this._rootParser,
        this.fileHandler
      );

      includedStory = parser.ParseStory();
    }

    this.RemoveOpenFilename(fullFilename);

    // Return valid IncludedFile object even if there were errors when parsing.
    // We don't want to attempt to re-parse the include line as something else,
    // and we want to include the bits that *are* valid, so we don't generate
    // more errors than necessary.
    return new IncludedFile(includedStory);
  };

  public readonly FilenameIsAlreadyOpen = (fullFilename: string): boolean =>
    this._rootParser._openFilenames.includes(fullFilename);

  public readonly AddOpenFilename = (fullFilename: string): void => {
    this._rootParser._openFilenames.push(fullFilename);
  };

  public readonly RemoveOpenFilename = (fullFilename: string) => {
    this._rootParser._openFilenames.splice(
      this._rootParser._openFilenames.indexOf(fullFilename),
      1
    );
  };

  /**
   * End Include section.
   */

  /**
   * Begin Knot section.
   */

  public readonly KnotDefinition = (): Knot | null => {
    const knotDecl: FlowDecl = this.Parse(this.KnotDeclaration) as FlowDecl;
    if (knotDecl === null) {
      return null;
    }

    this.Expect(
      this.EndOfLine,
      "end of line after knot name definition",
      this.SkipToNextLine
    );

    const innerKnotStatements: ParseRule = (): ParsedObject[] =>
      this.StatementsAtLevel(StatementLevel.Knot);

    const content = this.Expect(
      innerKnotStatements,
      "at least one line within the knot",
      this.KnotStitchNoContentRecoveryRule
    ) as ParsedObject[];

    return new Knot(knotDecl.name, content, knotDecl.args, knotDecl.isFunction);
  };

  public readonly KnotDeclaration = (): FlowDecl | null => {
    this.Whitespace();

    if (this.KnotTitleEquals() === null) {
      return null;
    }

    this.Whitespace();

    const identifier: Identifier = this.Parse(
      this.IdentifierWithMetadata
    ) as Identifier;
    let knotName: Identifier;

    const isFunc: boolean = identifier?.name === "function";
    if (isFunc) {
      this.Expect(this.Whitespace, "whitespace after the 'function' keyword");

      knotName = this.Parse(this.IdentifierWithMetadata) as Identifier;
    } else {
      knotName = identifier;
    }

    if (knotName === null) {
      this.Error(`Expected the name of the ${isFunc ? "function" : "knot"}`);
      knotName = new Identifier(""); // prevent later null ref
    }

    this.Whitespace();

    const parameterNames: Argument[] = this.Parse(
      this.BracketedKnotDeclArguments
    ) as Argument[];

    this.Whitespace();

    // Optional equals after name
    this.Parse(this.KnotTitleEquals);

    return new FlowDecl(knotName, parameterNames, isFunc);
  };

  public readonly KnotTitleEquals = (): string | null => {
    // 2+ "=" starts a knot
    const multiEquals = this.ParseCharactersFromString("=");
    if (multiEquals === null || multiEquals.length <= 1) {
      return null;
    }

    return multiEquals;
  };

  public readonly StitchDefinition = (): ParseRuleReturn => {
    const decl = this.Parse(this.StitchDeclaration) as FlowDecl;
    if (decl === null) {
      return null;
    }

    this.Expect(
      this.EndOfLine,
      "end of line after stitch name",
      this.SkipToNextLine
    );

    const innerStitchStatements: ParseRule = () =>
      this.StatementsAtLevel(StatementLevel.Stitch);

    const content = this.Expect(
      innerStitchStatements,
      "at least one line within the stitch",
      this.KnotStitchNoContentRecoveryRule
    ) as ParsedObject[];

    return new Stitch(decl.name, content, decl.args, decl.isFunction);
  };

  public readonly StitchDeclaration = (): FlowDecl | null => {
    this.Whitespace();

    // Single "=" to define a stitch
    if (this.ParseString("=") === null) {
      return null;
    }

    // If there's more than one "=", that's actually a knot definition (or divert), so this rule should fail
    if (this.ParseString("=") !== null) {
      return null;
    }

    this.Whitespace();

    // Stitches aren't allowed to be functions, but we parse it anyway and report the error later
    const isFunc: boolean = this.ParseString("function") !== null;
    if (isFunc) {
      this.Whitespace();
    }

    const stitchName: Identifier = this.Parse(
      this.IdentifierWithMetadata
    ) as Identifier;
    if (stitchName === null) {
      return null;
    }

    this.Whitespace();

    const flowArgs: Argument[] = this.Parse(
      this.BracketedKnotDeclArguments
    ) as Argument[];

    this.Whitespace();

    return new FlowDecl(stitchName, flowArgs, isFunc);
  };

  public readonly KnotStitchNoContentRecoveryRule = (): ParseRuleReturn => {
    // Jump ahead to the next knot or the end of the file
    this.ParseUntil(this.KnotDeclaration, new CharacterSet("="), null);

    const recoveredFlowContent: ParsedObject[] = [new Text("<ERROR IN FLOW>")];

    return recoveredFlowContent;
  };

  public readonly BracketedKnotDeclArguments = (): Argument[] | null => {
    if (this.ParseString("(") === null) {
      return null;
    }

    let flowArguments = this.Interleave<Argument>(
      this.Spaced(this.FlowDeclArgument),
      this.Exclude(this.String(","))
    );

    this.Expect(this.String(")"), "closing ')' for parameter list");

    // If no parameters, create an empty list so that this method is type safe and
    // doesn't attempt to return the ParseSuccess object
    if (flowArguments === null) {
      flowArguments = [];
    }

    return flowArguments;
  };

  public readonly FlowDeclArgument = (): Argument | null => {
    // Possible forms:
    //  name
    //  -> name      (variable divert target argument
    //  ref name
    //  ref -> name  (variable divert target by reference)
    const firstIden = this.Parse(this.IdentifierWithMetadata) as Identifier;
    this.Whitespace();

    const divertArrow = this.ParseDivertArrow();

    this.Whitespace();

    const secondIden = this.Parse(this.IdentifierWithMetadata) as Identifier;

    if (firstIden == null && secondIden === null) {
      return null;
    }

    const flowArg = new Argument();
    if (divertArrow !== null) {
      flowArg.isDivertTarget = true;
    }

    // Passing by reference
    if (firstIden !== null && firstIden.name === "ref") {
      if (secondIden === null) {
        this.Error("Expected an parameter name after 'ref'");
      }

      flowArg.identifier = secondIden;
      flowArg.isByReference = true;
    } else {
      // Simple argument name
      if (flowArg.isDivertTarget) {
        flowArg.identifier = secondIden;
      } else {
        flowArg.identifier = firstIden;
      }

      if (flowArg.identifier === null) {
        this.Error("Expected an parameter name");
      }

      flowArg.isByReference = false;
    }

    return flowArg;
  };

  public readonly ExternalDeclaration = (): ExternalDeclaration | null => {
    this.Whitespace();

    const external = this.Parse(
      this.IdentifierWithMetadata
    ) as Identifier | null;
    if (external === null || external.name != "EXTERNAL") {
      return null;
    }

    this.Whitespace();

    const funcIdentifier: Identifier =
      (this.Expect(
        this.IdentifierWithMetadata,
        "name of external function"
      ) as Identifier | null) || new Identifier("");

    this.Whitespace();

    let parameterNames = this.Expect(
      this.BracketedKnotDeclArguments,
      `declaration of arguments for EXTERNAL, even if empty, i.e. 'EXTERNAL ${funcIdentifier}()'`
    ) as Argument[];

    if (parameterNames === null) {
      parameterNames = [];
    }

    const argNames = parameterNames
      .map((arg) => arg.identifier?.name)
      .filter(filterUndef);

    return new ExternalDeclaration(funcIdentifier, argNames);
  };

  /**
   * End Knot section.
   */

  /**
   * Start Logic section.
   */

  private _identifierCharSet: CharacterSet | null = null;

  get identifierCharSet(): CharacterSet {
    if (this._identifierCharSet === null) {
      (this._identifierCharSet = new CharacterSet())
        .AddRange("A", "Z")
        .AddRange("a", "z")
        .AddRange("0", "9")
        .Add("_");

      // Enable non-ASCII characters for story identifiers.
      this.ExtendIdentifierCharacterRanges(this._identifierCharSet);
    }

    return this._identifierCharSet;
  }

  public readonly LogicLine = (): ParsedObject | null => {
    this.Whitespace();

    if (this.ParseString("~") === null) {
      return null;
    }

    this.Whitespace();

    // Some example lines we need to be able to distinguish between:
    // ~ temp x = 5  -- var decl + assign
    // ~ temp x      -- var decl
    // ~ x = 5       -- var assign
    // ~ x           -- expr (not var decl or assign)
    // ~ f()         -- expr
    // We don't treat variable decl/assign as an expression since we don't want an assignment
    // to have a return value, or to be used in compound expressions.
    const afterTilde: ParseRule = () =>
      this.OneOf([
        this.ReturnStatement,
        this.TempDeclarationOrAssignment,
        this.Expression,
      ]);

    let result = this.Expect(
      afterTilde,
      "expression after '~'",
      this.SkipToNextLine
    ) as ParsedObject;

    // Prevent further errors, already reported expected expression and have skipped to next line.
    if (result === null) {
      return new ContentList();
    }

    // Parse all expressions, but tell the writer off if they did something useless like:
    //  ~ 5 + 4
    // And even:
    //  ~ false && myFunction()
    // ...since it's bad practice, and won't do what they expect if
    // they're expecting C's lazy evaluation.
    if (
      result instanceof Expression &&
      !(result instanceof FunctionCall || result instanceof IncDecExpression)
    ) {
      this.Error(
        "Logic following a '~' can't be that type of expression. It can only be something like:\n\t~ return\n\t~ var x = blah\n\t~ x++\n\t~ myFunction()"
      );
    }

    // Line is pure function call? e.g.
    //  ~ f()
    // Add extra pop to make sure we tidy up after ourselves.
    // We no longer need anything on the evaluation stack.
    const funCall = asOrNull(result, FunctionCall);
    if (funCall) {
      funCall.shouldPopReturnedValue = true;
    }

    // If the expression contains a function call, then it could produce a text side effect,
    // in which case it needs a newline on the end. e.g.
    //  ~ printMyName()
    //  ~ x = 1 + returnAValueAndAlsoPrintStuff()
    // If no text gets printed, then the extra newline will have to be culled later.
    // Multiple newlines on the output will be removed, so there will be no "leak" for
    // long running calculations. It's disappointingly messy though :-/
    if (result.Find(FunctionCall)() !== null) {
      result = new ContentList(
        result as unknown as ParsedObject[],
        new Text("\n")
      );
    }

    this.Expect(this.EndOfLine, "end of line", this.SkipToNextLine);

    return result as ParsedObject;
  };

  public readonly VariableDeclaration = (): ParsedObject | null => {
    this.Whitespace();

    const id = this.Parse(this.Identifier);
    if (id !== "VAR") {
      return null;
    }

    this.Whitespace();

    const varName = this.Expect(
      this.IdentifierWithMetadata,
      "variable name"
    ) as Identifier;

    this.Whitespace();

    this.Expect(
      this.String("="),
      "the '=' for an assignment of a value, e.g. '= 5' (initial values are mandatory)"
    );

    this.Whitespace();

    const definition = this.Expect(this.Expression, "initial value for ");

    const expr = definition as Expression;

    if (expr) {
      const check =
        expr instanceof NumberExpression ||
        expr instanceof StringExpression ||
        expr instanceof DivertTarget ||
        expr instanceof VariableReference ||
        expr instanceof List;

      if (!check) {
        this.Error(
          "initial value for a variable must be a number, constant, list or divert target"
        );
      }

      if (this.Parse(this.ListElementDefinitionSeparator) !== null) {
        this.Error(
          "Unexpected ','. If you're trying to declare a new list, use the LIST keyword, not VAR"
        );
      } else if (expr instanceof StringExpression) {
        // Ensure string expressions are simple
        const strExpr = expr as StringExpression;
        if (!strExpr.isSingleString) {
          this.Error("Constant strings cannot contain any logic.");
        }
      }

      const result = new VariableAssignment({
        assignedExpression: expr,
        isGlobalDeclaration: true,
        variableIdentifier: varName,
      });

      return result;
    }

    return null;
  };

  public readonly ListDeclaration = (): VariableAssignment | null => {
    this.Whitespace();

    const id = this.Parse(this.Identifier);
    if (id != "LIST") {
      return null;
    }

    this.Whitespace();

    const varName = this.Expect(
      this.IdentifierWithMetadata,
      "list name"
    ) as Identifier;

    this.Whitespace();

    this.Expect(
      this.String("="),
      "the '=' for an assignment of the list definition"
    );

    this.Whitespace();

    const definition = this.Expect(
      this.ListDefinition,
      "list item names"
    ) as ListDefinition;

    if (definition) {
      definition.identifier = new Identifier(varName.name);
      return new VariableAssignment({
        variableIdentifier: varName,
        listDef: definition,
      });
    }

    return null;
  };

  public readonly ListDefinition = (): ListDefinition | null => {
    this.AnyWhitespace();

    const allElements = this.SeparatedList(
      this.ListElementDefinition,
      this.ListElementDefinitionSeparator
    ) as ListElementDefinition[];

    if (allElements === null) {
      return null;
    }

    return new ListDefinition(allElements);
  };

  public readonly ListElementDefinitionSeparator = (): string | null => {
    this.AnyWhitespace();

    if (this.ParseString(",") === null) {
      return null;
    }

    this.AnyWhitespace();

    return ",";
  };

  public readonly ListElementDefinition = () => {
    const inInitialList = this.ParseString("(") !== null;
    let needsToCloseParen = inInitialList;

    this.Whitespace();

    const name = this.Parse(this.IdentifierWithMetadata) as Identifier | null;
    if (name === null) {
      return null;
    }

    this.Whitespace();

    if (inInitialList) {
      if (this.ParseString(")") != null) {
        needsToCloseParen = false;
        this.Whitespace();
      }
    }

    let elementValue: number | null = null;
    if (this.ParseString("=") !== null) {
      this.Whitespace();

      const elementValueNum = this.Expect(
        this.ExpressionInt,
        "value to be assigned to list item"
      ) as NumberExpression;

      if (elementValueNum !== null) {
        elementValue = elementValueNum.value as number;
      }

      if (needsToCloseParen) {
        this.Whitespace();

        if (this.ParseString(")") !== null) {
          needsToCloseParen = false;
        }
      }
    }

    if (needsToCloseParen) {
      this.Error("Expected closing ')'");
    }

    return new ListElementDefinition(name, inInitialList, elementValue);
  };

  public readonly ConstDeclaration = (): ParsedObject | null => {
    this.Whitespace();

    const id = this.Parse(this.Identifier);
    if (id !== "CONST") {
      return null;
    }

    this.Whitespace();

    const varName = this.Expect(
      this.IdentifierWithMetadata,
      "constant name"
    ) as Identifier;

    this.Whitespace();

    this.Expect(
      this.String("="),
      "the '=' for an assignment of a value, e.g. '= 5' (initial values are mandatory)"
    );

    this.Whitespace();

    const expr = this.Expect(
      this.Expression,
      "initial value for "
    ) as Expression;

    const check =
      expr instanceof NumberExpression ||
      expr instanceof DivertTarget ||
      expr instanceof StringExpression;

    if (!check) {
      this.Error(
        "initial value for a constant must be a number or divert target"
      );
    } else if (expr instanceof StringExpression) {
      // Ensure string expressions are simple
      const strExpr = expr as StringExpression;
      if (!strExpr.isSingleString) {
        this.Error("Constant strings cannot contain any logic.");
      }
    }

    const result = new ConstantDeclaration(varName, expr);

    return result;
  };

  public readonly InlineLogicOrGlueOrStartTag = (): ParsedObject =>
    this.OneOf([this.InlineLogic, this.Glue, this.StartTag]) as ParsedObject;

  public readonly Glue = (): Glue | null => {
    // Don't want to parse whitespace, since it might be important
    // surrounding the glue.
    const glueStr = this.ParseString("<>");
    if (glueStr !== null) {
      return new Glue(new RuntimeGlue());
    }

    return null;
  };

  public readonly InlineLogic = () => {
    if (this.ParseString("{") === null) {
      return null;
    }

    let wasParsingString = this.parsingStringExpression;
    let wasTagActive = this.tagActive;

    this.Whitespace();

    const logic = this.Expect(
      this.InnerLogic,
      "some kind of logic, conditional or sequence within braces: { ... }"
    ) as ParsedObject;

    if (logic === null) {
      this.parsingStringExpression = wasParsingString;
      return null;
    }

    this.DisallowIncrement(logic);

    let contentList = asOrNull(logic, ContentList);
    if (!contentList) {
      contentList = new ContentList(logic as unknown as ParsedObject[]);
    }

    this.Whitespace();

    this.Expect(this.String("}"), "closing brace '}' for inline logic");

    // Allow nested strings and logic
    this.parsingStringExpression = wasParsingString;

    // Difference between:
    //
    //     1) A thing # {image}.jpg
    //     2) A {red #red|blue #blue} sequence.
    //
    //  When logic ends in (1) we still want tag to continue.
    //  When logic ends in (2) we want to auto-end the tag.
    //  Side note: we simply disallow tags within strings.
    if (!wasTagActive) this.EndTagIfNecessary(contentList);

    return contentList;
  };

  public readonly InnerLogic = (): ParsedObject | null => {
    this.Whitespace();

    // Explicitly try the combinations of inner logic
    // that could potentially have conflicts first.

    // Explicit sequence annotation?
    const explicitSeqType: SequenceType = this.ParseObject(
      this.SequenceTypeAnnotation
    ) as SequenceType;

    if (explicitSeqType !== null) {
      const contentLists = this.Expect(
        this.InnerSequenceObjects,
        "sequence elements (for cycle/stoping etc)"
      ) as ContentList[];

      if (contentLists === null) {
        return null;
      }

      return new Sequence(contentLists, explicitSeqType);
    }

    // Conditional with expression?
    const initialQueryExpression = this.Parse(
      this.ConditionExpression
    ) as Expression;
    if (initialQueryExpression) {
      const conditional = this.Expect(
        () => this.InnerConditionalContent(initialQueryExpression),
        "conditional content following query"
      ) as Conditional;

      return conditional;
    }

    // Now try to evaluate each of the "full" rules in turn
    const rules: ParseRule[] = [
      // Conditional still necessary, since you can have a multi-line conditional
      // without an initial query expression:
      // {
      //   - true:  this is true
      //   - false: this is false
      // }
      this.InnerConditionalContent as ParseRule,
      this.InnerSequence,
      this.InnerExpression,
    ];

    //let wasTagActiveAtStartOfScope = this.tagActive;

    // Adapted from "OneOf" structuring rule except that in
    // order for the rule to succeed, it has to maximally
    // cover the entire string within the { }. Used to
    // differentiate between:
    //  {myVar}                 -- Expression (try first)
    //  {my content is jolly}   -- sequence with single element
    for (const rule of rules) {
      const ruleId: number = this.BeginRule();

      const result: ParsedObject = this.ParseObject(rule) as ParsedObject;
      if (result) {
        // Not yet at end?
        if (this.Peek(this.Spaced(this.String("}"))) === null) {
          this.FailRule(ruleId);
        } else {
          // Full parse of content within braces
          return this.SucceedRule(ruleId, result) as ParsedObject;
        }
      } else {
        this.FailRule(ruleId);
      }
    }

    return null;
  };

  public readonly InnerExpression = (): ParsedObject => {
    const expr = this.Parse(this.Expression) as Expression;
    if (expr) {
      expr.outputWhenComplete = true;
    }

    return expr;
  };

  public readonly IdentifierWithMetadata = (): Identifier | null => {
    const id = this.Identifier();
    if (id === null) {
      return null;
    }
    return new Identifier(id);
  };

  // Note: we allow identifiers that start with a number,
  // but not if they *only* comprise numbers
  public readonly Identifier = (): string | null => {
    // Parse remaining characters (if any)
    const name = this.ParseCharactersFromCharSet(this.identifierCharSet);
    if (name === null) {
      return null;
    }

    // Reject if it's just a number
    let isNumberCharsOnly: boolean = true;
    for (let c of name) {
      if (!(c >= "0" && c <= "9")) {
        isNumberCharsOnly = false;
        break;
      }
    }

    if (isNumberCharsOnly) {
      return null;
    }

    return name;
  };

  /**
   * End Logic section.
   */

  /**
   * Begin Sequences section.
   */

  public _sequenceTypeSymbols: CharacterSet = new CharacterSet("!&~$");

  public readonly InnerSequence = (): Sequence | null => {
    this.Whitespace();

    // Default sequence type
    let seqType: SequenceType = SequenceType.Stopping;

    // Optional explicit sequence type
    const parsedSeqType: SequenceType = this.Parse(
      this.SequenceTypeAnnotation
    ) as SequenceType;

    if (parsedSeqType !== null) {
      seqType = parsedSeqType;
    }

    const contentLists = this.Parse(this.InnerSequenceObjects) as ContentList[];
    if (contentLists === null || contentLists.length <= 1) {
      return null;
    }

    return new Sequence(contentLists, seqType);
  };

  public readonly SequenceTypeAnnotation = (): ParseRuleReturn => {
    let annotation = this.Parse(
      this.SequenceTypeSymbolAnnotation
    ) as SequenceType;

    if (annotation === null) {
      annotation = this.Parse(this.SequenceTypeWordAnnotation) as SequenceType;
    }

    if (annotation === null) {
      return null;
    }

    switch (annotation) {
      case SequenceType.Once:
      case SequenceType.Cycle:
      case SequenceType.Stopping:
      case SequenceType.Shuffle:
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      case SequenceType.Shuffle | SequenceType.Stopping:
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      case SequenceType.Shuffle | SequenceType.Once:
        break;
      default:
        this.Error(`Sequence type combination not supported: ${annotation}`);
        return SequenceType.Stopping;
    }

    return annotation;
  };

  public readonly SequenceTypeSymbolAnnotation = (): ParseRuleReturn => {
    if (this._sequenceTypeSymbols === null) {
      this._sequenceTypeSymbols = new CharacterSet("!&~$ ");
    }

    let sequenceType = 0 as SequenceType;
    const sequenceAnnotations = this.ParseCharactersFromCharSet(
      this._sequenceTypeSymbols
    );

    if (sequenceAnnotations === null) {
      return null;
    }

    for (const symbolChar of sequenceAnnotations) {
      switch (symbolChar) {
        case "!":
          sequenceType |= SequenceType.Once;
          break;
        case "&":
          sequenceType |= SequenceType.Cycle;
          break;
        case "~":
          sequenceType |= SequenceType.Shuffle;
          break;
        case "$":
          sequenceType |= SequenceType.Stopping;
          break;
      }
    }

    if (sequenceType === (0 as SequenceType)) {
      return null;
    }

    return sequenceType;
  };

  public readonly SequenceTypeWordAnnotation = (): ParseRuleReturn => {
    const sequenceTypes = this.Interleave<SequenceType | null>(
      this.SequenceTypeSingleWord,
      this.Exclude(this.Whitespace)
    );

    if (sequenceTypes === null || sequenceTypes.length === 0) {
      return null;
    }

    if (this.ParseString(":") === null) {
      return null;
    }

    let combinedSequenceType = 0 as SequenceType;
    for (const seqType of sequenceTypes) {
      combinedSequenceType |= seqType!;
    }

    return combinedSequenceType;
  };

  public readonly SequenceTypeSingleWord = () => {
    let seqType: SequenceType | null = null;

    const word = this.Parse(this.IdentifierWithMetadata) as Identifier | null;

    if (word !== null) {
      switch (word.name) {
        case "once":
          seqType = SequenceType.Once;
          break;
        case "cycle":
          seqType = SequenceType.Cycle;
          break;
        case "shuffle":
          seqType = SequenceType.Shuffle;
          break;
        case "stopping":
          seqType = SequenceType.Stopping;
          break;
      }
    }

    if (seqType === null) {
      return null;
    }

    return seqType;
  };

  public readonly InnerSequenceObjects = (): ContentList[] => {
    const multiline = this.Parse(this.Newline) !== null;

    let result: ContentList[] | null = null;
    if (multiline) {
      result = this.Parse(this.InnerMultilineSequenceObjects) as ContentList[];
    } else {
      result = this.Parse(this.InnerInlineSequenceObjects) as ContentList[];
    }

    return result;
  };

  public readonly InnerInlineSequenceObjects = (): ContentList[] | null => {
    const interleavedContentAndPipes = this.Interleave<ParsedObject>(
      this.Optional(this.MixedTextAndLogic),
      this.String("|"),
      null,
      false
    );

    if (interleavedContentAndPipes === null) {
      return null;
    }

    const result = [];

    // The content and pipes won't necessarily be perfectly interleaved in the sense that
    // the content can be missing, but in that case it's intended that there's blank content.
    let justHadContent: boolean = false;
    for (const contentOrPipe of interleavedContentAndPipes) {
      // Pipe/separator
      if ((contentOrPipe as any) === "|") {
        // Expected content, saw pipe - need blank content now
        if (!justHadContent) {
          // Add blank content
          result.push(new ContentList());
        }

        justHadContent = false;
      } else {
        // Real content
        const content = contentOrPipe as unknown as ParsedObject[];
        if (content === null) {
          this.Error(
            `Expected content, but got ${contentOrPipe as unknown as string} (this is an ink compiler bug!)`
          );
        } else {
          result.push(new ContentList(content));
        }

        justHadContent = true;
      }
    }

    // Ended in a pipe? Need to insert final blank content
    if (!justHadContent) {
      result.push(new ContentList());
    }

    return result;
  };

  public readonly InnerMultilineSequenceObjects = (): ContentList[] | null => {
    this.MultilineWhitespace();

    const contentLists = this.OneOrMore(
      this.SingleMultilineSequenceElement
    ) as ContentList[];
    if (contentLists === null) {
      return null;
    }

    return contentLists;
  };

  public readonly SingleMultilineSequenceElement = () => {
    this.Whitespace();

    // Make sure we're not accidentally parsing a divert
    if (this.ParseString("->") !== null) {
      return null;
    }

    if (this.ParseString("-") === null) {
      return null;
    }

    this.Whitespace();

    const content: ParsedObject[] = this.StatementsAtLevel(
      StatementLevel.InnerBlock
    );

    if (content === null) {
      this.MultilineWhitespace();
    } else {
      // Add newline at the start of each branch
      content.unshift(new Text("\n"));
    }

    return new ContentList(content);
  };

  /**
   * End Sequences section.
   */

  /**
   * Begin Statements section.
   */

  private _statementRulesAtLevel: ParseRule[][] = [];
  private _statementBreakRulesAtLevel: ParseRule[][] = [];

  public readonly StatementsAtLevel = (
    level: StatementLevel
  ): ParsedObject[] => {
    // Check for error: Should not be allowed gather dashes within an inner block
    if (level === StatementLevel.InnerBlock) {
      const badGatherDashCount = this.Parse(this.GatherDashes) as ParsedObject;
      if (badGatherDashCount !== null) {
        this.Error(
          "You can't use a gather (the dashes) within the { curly braces } context. For multi-line sequences and conditions, you should only use one dash."
        );
      }
    }

    return this.Interleave<ParsedObject>(
      this.Optional(this.MultilineWhitespace),
      () => this.StatementAtLevel(level),
      () => this.StatementsBreakForLevel(level)
    );
  };

  public readonly StatementAtLevel = (level: StatementLevel): ParsedObject => {
    const rulesAtLevel: ParseRule[] =
      this._statementRulesAtLevel[level as number];
    const statement = this.OneOf(rulesAtLevel) as ReturnType;

    // For some statements, allow them to parse, but create errors, since
    // writers may think they can use the statement, so it's useful to have
    // the error message.
    if (level === StatementLevel.Top) {
      if (statement instanceof ReturnType) {
        this.Error("should not have return statement outside of a knot");
      }
    }

    return statement;
  };

  public readonly StatementsBreakForLevel = (
    level: StatementLevel
  ): ParseRuleReturn => {
    this.Whitespace();

    const breakRules: ParseRule[] =
      this._statementBreakRulesAtLevel[level as number];
    const breakRuleResult = this.OneOf(breakRules);
    if (breakRuleResult === null) {
      return null;
    }

    return breakRuleResult;
  };

  public readonly GenerateStatementLevelRules = () => {
    const levels: StatementLevel[] = Object.values(
      StatementLevel
    ) as StatementLevel[];

    this._statementRulesAtLevel = "f"
      .repeat(levels.length)
      .split("f")
      .map(() => []);

    this._statementBreakRulesAtLevel = "f"
      .repeat(levels.length)
      .split("f")
      .map(() => []);

    for (const level of levels) {
      const rulesAtLevel: ParseRule[] = [];
      const breakingRules: ParseRule[] = [];

      // Diverts can go anywhere
      rulesAtLevel.push(this.Line(this.MultiDivert));

      // Knots can only be parsed at Top/Global scope
      if (level >= StatementLevel.Top) {
        rulesAtLevel.push(this.KnotDefinition);
      }

      rulesAtLevel.push(this.Line(this.Choice));

      rulesAtLevel.push(this.Line(this.AuthorWarning));

      // Gather lines would be confused with multi-line block separators, like
      // within a multi-line if statement
      if (level > StatementLevel.InnerBlock) {
        rulesAtLevel.push(this.Gather);
      }

      // Stitches (and gathers) can (currently) only go in Knots and top level
      if (level >= StatementLevel.Knot) {
        rulesAtLevel.push(this.StitchDefinition);
      }

      // Global variable declarations can go anywhere
      rulesAtLevel.push(this.Line(this.ListDeclaration));
      rulesAtLevel.push(this.Line(this.VariableDeclaration));
      rulesAtLevel.push(this.Line(this.ConstDeclaration));
      rulesAtLevel.push(this.Line(this.ExternalDeclaration));

      // Global include can go anywhere
      rulesAtLevel.push(this.Line(this.IncludeStatement));

      // Normal logic / text can go anywhere
      rulesAtLevel.push(this.LogicLine);
      rulesAtLevel.push(this.LineOfMixedTextAndLogic);

      // --------
      // Breaking rules

      // Break current knot with a new knot
      if (level <= StatementLevel.Knot) {
        breakingRules.push(this.KnotDeclaration);
      }

      // Break current stitch with a new stitch
      if (level <= StatementLevel.Stitch) {
        breakingRules.push(this.StitchDeclaration);
      }

      // Breaking an inner block (like a multi-line condition statement)
      if (level <= StatementLevel.InnerBlock) {
        breakingRules.push(this.ParseDashNotArrow);
        breakingRules.push(this.String("}"));
      }

      this._statementRulesAtLevel[level as number] = rulesAtLevel;
      this._statementBreakRulesAtLevel[level as number] = breakingRules;
    }
  };

  public readonly SkipToNextLine = (): typeof ParseSuccess => {
    this.ParseUntilCharactersFromString("\n\r");
    this.ParseNewline();

    return ParseSuccess;
  };

  // Modifier to turn a rule into one that expects a newline on the end.
  // e.g. anywhere you can use "MixedTextAndLogic" as a rule, you can use
  // "Line(MixedTextAndLogic)" to specify that it expects a newline afterwards.
  public readonly Line =
    (inlineRule: ParseRule): ParseRule =>
    () => {
      const result = this.ParseObject(inlineRule);
      if (result === null) {
        return null;
      }

      this.Expect(this.EndOfLine, "end of line", this.SkipToNextLine);

      return result;
    };

  /**
   * End Statements section.
   */

  /**
   * Begin Tags section.
   */

  public readonly StartTag = (): ParsedObject | null => {
    this.Whitespace();

    if (this.ParseString("#") === null) {
      return null;
    }

    if (this.parsingStringExpression) {
      this.Error(
        "Tags aren't allowed inside of strings. Please use \\# if you want a hash symbol."
      );
    }

    let result: ParsedObject | null = null;
    if (this.tagActive) {
      let contentList = new ContentList();
      contentList.AddContent(new Tag(/*isStart:*/ false));
      contentList.AddContent(new Tag(/*isStart:*/ true));
      result = contentList;
    } else {
      result = new Tag(/*isStart:*/ true);
    }
    this.tagActive = true;

    this.Whitespace();

    return result;
  };

  public EndTagIfNecessary(outputContentList: ParsedObject[] | null): void;
  public EndTagIfNecessary(outputContentList: ContentList | null): void;
  public EndTagIfNecessary(
    outputContentList: ParsedObject[] | ContentList | null
  ): void {
    if (this.tagActive) {
      if (outputContentList != null) {
        if (outputContentList instanceof ContentList) {
          outputContentList.AddContent(new Tag(/*isStart:*/ false));
        } else {
          outputContentList.push(new Tag(/*isStart:*/ false));
        }
      }
      this.tagActive = false;
    }
  }

  /**
   * End Tags section.
   */

  /**
   * Begin Whitespace section.
   */

  private _inlineWhitespaceChars: CharacterSet = new CharacterSet(" \t");

  // Handles both newline and endOfFile
  public readonly EndOfLine = () => this.OneOf([this.Newline, this.EndOfFile]);

  // Allow whitespace before the actual newline
  public readonly Newline = (): typeof ParseSuccess | null => {
    this.Whitespace();

    const gotNewline: boolean = this.ParseNewline() !== null;

    // Optional \r, definite \n to support Windows (\r\n) and Mac/Unix (\n)

    if (!gotNewline) {
      return null;
    }

    return ParseSuccess;
  };

  public readonly EndOfFile = (): typeof ParseSuccess | null => {
    this.Whitespace();

    if (!this.endOfInput) return null;

    return ParseSuccess;
  };

  // General purpose space, returns N-count newlines (fails if no newlines)
  public readonly MultilineWhitespace = (): typeof ParseSuccess | null => {
    let newlines: ParseRuleReturn[] | null = this.OneOrMore(this.Newline);
    if (newlines === null) {
      return null;
    }

    // Use content field of Token to say how many newlines there were
    // (in most circumstances it's unimportant)
    const numNewlines: number = newlines.length;
    if (numNewlines >= 1) {
      return ParseSuccess;
    }

    return null;
  };

  public readonly Whitespace = (): typeof ParseSuccess | null => {
    const doneParsed = this.ParseCharactersFromCharSet(
      this._inlineWhitespaceChars
    );

    if (doneParsed !== null) {
      return ParseSuccess;
    }

    return null;
  };

  public readonly Spaced =
    (rule: ParseRule): ParseRule =>
    () => {
      this.Whitespace();

      const result = this.ParseObject(rule);
      if (result === null) {
        return null;
      }

      this.Whitespace();

      return result;
    };

  public readonly AnyWhitespace = (): typeof ParseSuccess | null => {
    let anyWhitespace: boolean = false;

    while (this.OneOf([this.Whitespace, this.MultilineWhitespace]) !== null) {
      anyWhitespace = true;
    }

    return anyWhitespace ? ParseSuccess : null;
  };

  public readonly MultiSpaced =
    (rule: ParseRule): ParseRuleReturn =>
    () => {
      this.AnyWhitespace();

      const result = this.ParseObject(rule);
      if (result === null) {
        return null;
      }

      this.AnyWhitespace();

      return result;
    };

  private _filename: string | null = null;
  private _externalErrorHandler: ErrorHandler | null = null;
  private _fileHandler: IFileHandler | null = null;

  /**
   * End Whitespace section.
   */
}
