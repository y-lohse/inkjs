import { ParsedObject } from "./Object";
import { InkObject as RuntimeObject } from "../../../engine/Object";

export class Wrap<T extends RuntimeObject> extends ParsedObject {
  constructor(private _objToWrap: T) {
    super();
  }

  public readonly GenerateRuntimeObject = (): RuntimeObject => this._objToWrap;
}
