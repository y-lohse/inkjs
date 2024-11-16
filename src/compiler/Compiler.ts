import { CompilerOptions } from "./CompilerOptions";
import { DebugSourceRange } from "./DebugSourceRange";
import { ErrorType } from "./Parser/ErrorType";
import { InkParser } from "./Parser/InkParser";
import { Story } from "../engine/Story";
import { Story as ParsedStory } from "./Parser/ParsedHierarchy/Story";
import { DebugMetadata } from "../engine/DebugMetadata";
import { StringValue } from "../engine/Value";
import { asOrNull } from "../engine/TypeAssertion";
import { GenerateStoryStats, Stats } from "./Stats";

export { CompilerOptions } from "./CompilerOptions";
export { InkParser } from "./Parser/InkParser";
export { StatementLevel } from "./Parser/StatementLevel";
export { JsonFileHandler } from "./FileHandler/JsonFileHandler";
export { InkList, Story } from "../engine/Story";

export class Compiler {
  private _errors: string[] = [];
  get errors(): string[] {
    return this._errors;
  }

  private _warnings: string[] = [];
  get warnings(): string[] {
    return this._warnings;
  }

  private _authorMessages: string[] = [];
  get authorMessages(): string[] {
    return this._authorMessages;
  }

  private _inputString: string;
  get inputString(): string {
    return this._inputString;
  }

  private _options: CompilerOptions;
  get options(): CompilerOptions {
    return this._options;
  }

  private _parsedStory: ParsedStory | null = null;
  get parsedStory(): ParsedStory {
    if (!this._parsedStory) {
      throw new Error();
    }

    return this._parsedStory;
  }

  private _runtimeStory: Story | null = null;
  get runtimeStory(): Story {
    if (!this._runtimeStory) {
      throw new Error("Compilation failed.");
    }

    return this._runtimeStory;
  }

  private _parser: InkParser | null = null;
  get parser(): InkParser {
    if (!this._parser) {
      throw new Error();
    }

    return this._parser;
  }

  private _debugSourceRanges: DebugSourceRange[] = [];
  get debugSourceRanges(): DebugSourceRange[] {
    return this._debugSourceRanges;
  }

  constructor(inkSource: string, options: CompilerOptions | null = null) {
    this._inputString = inkSource;
    this._options = options || new CompilerOptions();
  }

  public readonly Compile = (): Story => {
    this._parser = new InkParser(
      this.inputString,
      this.options.sourceFilename || null,
      this.OnError,
      null,
      this.options.fileHandler
    );

    this._parsedStory = this.parser.ParseStory();

    if (this.errors.length === 0) {
      this.parsedStory.countAllVisits = this.options.countAllVisits;
      this._runtimeStory = this.parsedStory.ExportRuntime(this.OnError);
    } else {
      this._runtimeStory = null;
    }

    return this.runtimeStory;
  };

  public readonly RetrieveDebugSourceForLatestContent = (): void => {
    for (const outputObj of this.runtimeStory.state.outputStream) {
      const textContent = asOrNull(outputObj, StringValue);
      if (textContent !== null) {
        const range = new DebugSourceRange(
          textContent.value?.length || 0,
          textContent.debugMetadata,
          textContent.value || "unknown"
        );

        this.debugSourceRanges.push(range);
      }
    }
  };

  public readonly GenerateStats = (): Stats | null => {
    if (this._parsedStory === null) {
      return null;
    }
    return GenerateStoryStats(this._parsedStory);
  };

  public readonly DebugMetadataForContentAtOffset = (
    offset: number
  ): DebugMetadata | null => {
    let currOffset = 0;

    let lastValidMetadata: DebugMetadata | null = null;
    for (const range of this.debugSourceRanges) {
      if (range.debugMetadata !== null) {
        lastValidMetadata = range.debugMetadata;
      }

      if (offset >= currOffset && offset < currOffset + range.length) {
        return lastValidMetadata;
      }

      currOffset += range.length;
    }

    return null;
  };

  public readonly OnError = (message: string, errorType: ErrorType) => {
    switch (errorType) {
      case ErrorType.Author:
        this._authorMessages.push(message);
        break;

      case ErrorType.Warning:
        this._warnings.push(message);
        break;

      case ErrorType.Error:
        this._errors.push(message);
        break;
    }

    if (this.options.errorHandler !== null) {
      this.options.errorHandler(message, errorType);
    }
  };
}
