import { Container as RuntimeContainer } from "../../../engine/Container";
import { DebugMetadata } from "../../../engine/DebugMetadata";
import { FindQueryFunc } from "./FindQueryFunc";
import { InkObject as RuntimeObject } from "../../../engine/Object";
import { Path as RuntimePath } from "../../../engine/Path";
import { Story } from "./Story";
import { asOrNull } from "../../../engine/TypeAssertion";

export abstract class ParsedObject {
  public abstract readonly GenerateRuntimeObject: () => RuntimeObject | null;

  private _alreadyHadError: boolean = false;
  private _alreadyHadWarning: boolean = false;
  private _debugMetadata: DebugMetadata | null = null;
  private _runtimeObject: RuntimeObject | null = null;

  public content: ParsedObject[] = [];
  public parent: ParsedObject | null = null;

  get debugMetadata() {
    if (this._debugMetadata === null && this.parent) {
      return this.parent.debugMetadata;
    }

    return this._debugMetadata;
  }

  set debugMetadata(value: DebugMetadata | null) {
    this._debugMetadata = value;
  }

  get hasOwnDebugMetadata(): boolean {
    return Boolean(this.debugMetadata);
  }

  get typeName(): string {
    return "ParsedObject";
  }

  public readonly GetType = (): string => this.typeName;

  get story(): Story {
    let ancestor: ParsedObject = this;
    while (ancestor.parent) {
      ancestor = ancestor.parent;
    }

    return ancestor as Story;
  }

  get runtimeObject(): RuntimeObject {
    if (!this._runtimeObject) {
      this._runtimeObject = this.GenerateRuntimeObject();
      if (this._runtimeObject) {
        this._runtimeObject.debugMetadata = this.debugMetadata;
      }
    }

    return this._runtimeObject as RuntimeObject;
  }

  set runtimeObject(value: RuntimeObject) {
    this._runtimeObject = value;
  }

  get runtimePath(): RuntimePath {
    if (!this.runtimeObject.path) {
      throw new Error();
    }

    return this.runtimeObject.path;
  }

  // When counting visits and turns since, different object
  // types may have different containers that needs to be counted.
  // For most it'll just be the object's main runtime object,
  // but for e.g. choices, it'll be the target container.
  get containerForCounting(): RuntimeContainer | null {
    return this.runtimeObject as RuntimeContainer;
  }

  get ancestry(): ParsedObject[] {
    let result = [];

    let ancestor = this.parent;
    while (ancestor) {
      result.push(ancestor);
      ancestor = ancestor.parent;
    }

    result = result.reverse();

    return result;
  }

  /*
  get descriptionOfScope(): string {
    const locationNames: string[] = [];

    let ancestor: ParsedObject | null = this;
    while (ancestor) {
      var ancestorFlow = ancestor as FlowBase;
      if (ancestorFlow && ancestorFlow.name != null) {
        locationNames.push(`'${ancestorFlow.name}'`);
      }
      ancestor = ancestor.parent;
    }

    let scopeSB = '';
    if (locationNames.length > 0) {
      const locationsListStr = locationNames.join(', ');
      scopeSB += `${locationsListStr} and`;
    }

    scopeSB += 'at top scope';

    return scopeSB;
  }
*/

  // Return the object so that method can be chained easily
  public readonly AddContent = <T extends ParsedObject, V extends T | T[]>(
    subContent: V
  ) => {
    if (this.content === null) {
      this.content = [];
    }

    const sub = Array.isArray(subContent) ? subContent : [subContent];

    // Make resilient to content not existing, which can happen
    // in the case of parse errors where we've already reported
    // an error but still want a valid structure so we can
    // carry on parsing.
    for (const ss of sub) {
      if (ss.hasOwnProperty("parent")) {
        ss.parent = this;
      }
      this.content.push(ss);
    }

    if (Array.isArray(subContent)) {
      return;
    } else {
      return subContent;
    }
  };

  public readonly InsertContent = <T extends ParsedObject>(
    index: number,
    subContent: T
  ): T => {
    if (this.content === null) {
      this.content = [];
    }

    subContent.parent = this;
    this.content.splice(index, 0, subContent);

    return subContent;
  };

  public readonly Find =
    <T extends ParsedObject>(
      type: (new (...arg: any[]) => T) | (Function & { prototype: T })
    ) =>
    (queryFunc: FindQueryFunc<T> | null = null): T | null => {
      let tObj = asOrNull(this, type) as any as T;
      if (tObj !== null && (queryFunc === null || queryFunc(tObj) === true)) {
        return tObj;
      }

      if (this.content === null) {
        return null;
      }

      for (const obj of this.content) {
        let nestedResult = obj.Find && obj.Find(type)(queryFunc);
        if (nestedResult) {
          return nestedResult as T;
        }
      }

      return null;
    };

  public readonly FindAll =
    <T extends ParsedObject>(
      type: (new (...arg: any[]) => T) | (Function & { prototype: T })
    ) =>
    (queryFunc?: FindQueryFunc<T>, foundSoFar?: T[]): T[] => {
      const found = Array.isArray(foundSoFar) ? foundSoFar : [];

      const tObj = asOrNull(this, type);
      if (tObj !== null && (!queryFunc || queryFunc(tObj) === true)) {
        found.push(tObj);
      }

      if (this.content === null) {
        return [];
      }

      for (const obj of this.content) {
        obj.FindAll && obj.FindAll(type)(queryFunc, found);
      }

      return found;
    };

  public ResolveReferences(context: Story) {
    if (this.content !== null) {
      for (const obj of this.content) {
        obj.ResolveReferences(context);
      }
    }
  }

  public Error(
    message: string,
    source: ParsedObject | null = null,
    isWarning: boolean = false
  ): void {
    if (source === null) {
      source = this;
    }

    // Only allow a single parsed object to have a single error *directly* associated with it
    if (
      (source._alreadyHadError && !isWarning) ||
      (source._alreadyHadWarning && isWarning)
    ) {
      return;
    }

    if (this.parent) {
      this.parent.Error(message, source, isWarning);
    } else {
      throw new Error(`No parent object to send error to: ${message}`);
    }

    if (isWarning) {
      source._alreadyHadWarning = true;
    } else {
      source._alreadyHadError = true;
    }
  }

  public readonly Warning = (
    message: string,
    source: ParsedObject | null = null
  ): void => {
    this.Error(message, source, true);
  };
}
