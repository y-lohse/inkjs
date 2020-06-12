import { InkObject } from "./Object";
import { Container } from "./Container";

export class StatePatch {
  get globals() {
    return this._globals;
  }
  get changedVariables() {
    return this._changedVariables;
  }
  get visitCounts() {
    return this._visitCounts;
  }
  get turnIndices() {
    return this._turnIndices;
  }

  constructor();
  constructor(toCopy: StatePatch | null);
  constructor() {
    if (arguments.length === 1 && arguments[0] !== null) {
      let toCopy = arguments[0] as StatePatch;
      this._globals = new Map(toCopy._globals);
      this._changedVariables = new Set(toCopy._changedVariables);
      this._visitCounts = new Map(toCopy._visitCounts);
      this._turnIndices = new Map(toCopy._turnIndices);
    } else {
      this._globals = new Map();
      this._changedVariables = new Set();
      this._visitCounts = new Map();
      this._turnIndices = new Map();
    }
  }

  public TryGetGlobal(name: string | null, /* out */ value: InkObject | null) {
    if (name !== null && this._globals.has(name)) {
      return { result: this._globals.get(name), exists: true };
    }

    return { result: value, exists: false };
  }

  public SetGlobal(name: string, value: InkObject) {
    this._globals.set(name, value);
  }

  public AddChangedVariable(name: string) {
    return this._changedVariables.add(name);
  }

  public TryGetVisitCount(container: Container, /* out */ count: number) {
    if (this._visitCounts.has(container)) {
      return { result: this._visitCounts.get(container), exists: true };
    }

    return { result: count, exists: false };
  }

  public SetVisitCount(container: Container, count: number) {
    this._visitCounts.set(container, count);
  }

  public SetTurnIndex(container: Container, index: number) {
    this._turnIndices.set(container, index);
  }

  public TryGetTurnIndex(container: Container, /* out */ index: number) {
    if (this._turnIndices.has(container)) {
      return { result: this._turnIndices.get(container), exists: true };
    }

    return { result: index, exists: false };
  }

  private _globals: Map<string, InkObject>;
  private _changedVariables: Set<string> = new Set();
  private _visitCounts: Map<Container, number> = new Map();
  private _turnIndices: Map<Container, number> = new Map();
}
