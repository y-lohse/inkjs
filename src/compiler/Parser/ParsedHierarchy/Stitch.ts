import { Argument } from "./Argument";
import { FlowBase } from "./Flow/FlowBase";
import { FlowLevel } from "./Flow/FlowLevel";
import { Identifier } from "./Identifier";
import { ParsedObject } from "./Object";

export class Stitch extends FlowBase {
  get flowLevel(): FlowLevel {
    return FlowLevel.Stitch;
  }

  constructor(
    name: Identifier,
    topLevelObjects: ParsedObject[],
    args: Argument[],
    isFunction: boolean
  ) {
    super(name, topLevelObjects, args, isFunction);
  }

  get typeName(): string {
    return "Stitch";
  }

  // Fixes TS issue with not being able to access the prototype via `super` in functions
  // attached to the class as properties.
  private baseToString = this.toString;

  public toString = (): string => {
    return `${
      this.parent !== null ? this.parent + " > " : ""
    }${this.baseToString()}`;
  };
}
