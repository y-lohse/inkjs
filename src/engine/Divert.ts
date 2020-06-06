import { Path } from "./Path";
import { PushPopType } from "./PushPop";
import { StringBuilder } from "./StringBuilder";
import { InkObject } from "./Object";
import { Pointer } from "./Pointer";
import { Container } from "./Container";
import { throwNullException } from "./NullException";

export class Divert extends InkObject {
  get targetPath() {
    if (this._targetPath != null && this._targetPath.isRelative) {
      let targetObj = this.targetPointer.Resolve();
      if (targetObj) {
        this._targetPath = targetObj.path;
      }
    }

    return this._targetPath;
  }
  set targetPath(value: Path | null) {
    this._targetPath = value;
    this._targetPointer = Pointer.Null;
  }

  public _targetPath: Path | null = null;

  get targetPointer() {
    if (this._targetPointer.isNull) {
      let targetObj = this.ResolvePath(this._targetPath).obj;

      if (this._targetPath === null)
        return throwNullException("this._targetPath");
      if (this._targetPath.lastComponent === null)
        return throwNullException("this._targetPath.lastComponent");

      if (this._targetPath.lastComponent.isIndex) {
        if (targetObj === null) return throwNullException("targetObj");
        this._targetPointer.container =
          targetObj.parent instanceof Container ? targetObj.parent : null;
        this._targetPointer.index = this._targetPath.lastComponent.index;
      } else {
        this._targetPointer = Pointer.StartOf(
          targetObj instanceof Container ? targetObj : null
        );
      }
    }

    return this._targetPointer.copy();
  }

  public _targetPointer: Pointer = Pointer.Null;

  get targetPathString() {
    if (this.targetPath == null) return null;

    return this.CompactPathString(this.targetPath);
  }
  set targetPathString(value: string | null) {
    if (value == null) {
      this.targetPath = null;
    } else {
      this.targetPath = new Path(value);
    }
  }

  public variableDivertName: string | null = null;
  get hasVariableTarget() {
    return this.variableDivertName != null;
  }

  public pushesToStack: boolean = false;
  public stackPushType: PushPopType = 0;

  public isExternal: boolean = false;
  public externalArgs: number = 0;

  public isConditional: boolean = false;

  constructor(stackPushType?: PushPopType) {
    super();
    this.pushesToStack = false;

    if (typeof stackPushType !== "undefined") {
      this.pushesToStack = true;
      this.stackPushType = stackPushType;
    }
  }

  public Equals(obj: Divert | null) {
    let otherDivert = obj;
    if (otherDivert instanceof Divert) {
      if (this.hasVariableTarget == otherDivert.hasVariableTarget) {
        if (this.hasVariableTarget) {
          return this.variableDivertName == otherDivert.variableDivertName;
        } else {
          if (this.targetPath === null)
            return throwNullException("this.targetPath");
          return this.targetPath.Equals(otherDivert.targetPath);
        }
      }
    }
    return false;
  }

  public toString() {
    if (this.hasVariableTarget) {
      return "Divert(variable: " + this.variableDivertName + ")";
    } else if (this.targetPath == null) {
      return "Divert(null)";
    } else {
      let sb = new StringBuilder();

      let targetStr = this.targetPath.toString();
      // int? targetLineNum = DebugLineNumberOfPath (targetPath);
      let targetLineNum = null;
      if (targetLineNum != null) {
        targetStr = "line " + targetLineNum;
      }

      sb.Append("Divert");

      if (this.isConditional) sb.Append("?");

      if (this.pushesToStack) {
        if (this.stackPushType == PushPopType.Function) {
          sb.Append(" function");
        } else {
          sb.Append(" tunnel");
        }
      }

      sb.Append(" -> ");
      sb.Append(this.targetPathString);

      sb.Append(" (");
      sb.Append(targetStr);
      sb.Append(")");

      return sb.toString();
    }
  }
}
