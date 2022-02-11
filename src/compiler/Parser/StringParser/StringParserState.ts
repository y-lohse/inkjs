import { StringParserElement } from "./StringParserElement";

export class StringParserState {
  private _stack: StringParserElement[] = [];
  private _numElements: number = 0;

  get currentElement(): StringParserElement {
    return this._stack[this._numElements - 1];
  }

  get lineIndex(): number {
    return this.currentElement.lineIndex;
  }

  set lineIndex(value: number) {
    this.currentElement.lineIndex = value;
  }

  get characterIndex(): number {
    return this.currentElement.characterIndex;
  }

  set characterIndex(value: number) {
    this.currentElement.characterIndex = value;
  }

  get characterInLineIndex(): number {
    return this.currentElement.characterInLineIndex;
  }

  set characterInLineIndex(value: number) {
    this.currentElement.characterInLineIndex = value;
  }

  get customFlags(): number {
    return this.currentElement.customFlags;
  }

  set customFlags(value: number) {
    this.currentElement.customFlags = value;
  }

  get errorReportedAlreadyInScope(): boolean {
    return this.currentElement.reportedErrorInScope;
  }

  get stackHeight(): number {
    return this._numElements;
  }

  constructor() {
    const kExpectedMaxStackDepth = 200;
    for (let i = 0; i < kExpectedMaxStackDepth; i++) {
      this._stack[i] = new StringParserElement();
    }
    this._numElements = 1;
  }

  public readonly StringParserState = (): void => {
    const kExpectedMaxStackDepth: number = 200;
    this._stack = new Array(kExpectedMaxStackDepth);

    for (let ii = 0; ii < kExpectedMaxStackDepth; ++ii) {
      this._stack[ii] = new StringParserElement();
    }

    this._numElements = 1;
  };

  public readonly Push = (): number => {
    if (this._numElements >= this._stack.length && this._numElements > 0) {
      throw new Error("Stack overflow in parser state.");
    }

    const prevElement = this._stack[this._numElements - 1];
    const newElement = this._stack[this._numElements];
    this._numElements++;

    newElement.CopyFrom(prevElement);

    return newElement.uniqueId;
  };

  public readonly Pop = (expectedRuleId: number): void => {
    if (this._numElements == 1) {
      throw new Error(
        "Attempting to remove final stack element is illegal! Mismatched Begin/Succceed/Fail?"
      );
    }

    if (this.currentElement.uniqueId != expectedRuleId) {
      throw new Error(
        "Mismatched rule IDs while Poping - do you have mismatched Begin/Succeed/Fail?"
      );
    }

    // Restore state
    this._numElements -= 1;
  };

  public Peek = (expectedRuleId: number) => {
    if (this.currentElement.uniqueId != expectedRuleId) {
      throw new Error(
        "Mismatched rule IDs while Peeking - do you have mismatched Begin/Succeed/Fail?"
      );
    }

    return this._stack[this._numElements - 1];
  };

  public readonly PeekPenultimate = (): StringParserElement | null => {
    if (this._numElements >= 2) {
      return this._stack[this._numElements - 2];
    }

    return null;
  };

  // Reduce stack height while maintaining currentElement
  // Remove second last element: i.e. "squash last two elements together"
  // Used when succeeding from a rule (and ONLY when succeeding, since
  // the state of the top element is retained).
  public readonly Squash = (): void => {
    if (this._numElements < 2) {
      throw new Error(
        "Attempting to remove final stack element is illegal! Mismatched Begin/Succceed/Fail?"
      );
    }

    const penultimateEl = this._stack[this._numElements - 2];
    const lastEl = this._stack[this._numElements - 1];

    penultimateEl.SquashFrom(lastEl);

    this._numElements -= 1;
  };

  public readonly NoteErrorReported = (): void => {
    for (const el of this._stack) {
      el.reportedErrorInScope = true;
    }
  };
}
