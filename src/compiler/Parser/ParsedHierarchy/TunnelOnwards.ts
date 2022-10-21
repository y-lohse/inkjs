import { Container as RuntimeContainer } from "../../../engine/Container";
import { ControlCommand as RuntimeControlCommand } from "../../../engine/ControlCommand";
import { Divert } from "./Divert/Divert";
import { Divert as RuntimeDivert } from "../../../engine/Divert";
import { DivertTargetValue } from "../../../engine/Value";
import { ParsedObject } from "./Object";
import { InkObject as RuntimeObject } from "../../../engine/Object";
import { Story } from "./Story";
import { Void } from "../../../engine/Void";
import { asOrNull } from "../../../engine/TypeAssertion";
import { VariableReference } from "../../../engine/VariableReference";

export class TunnelOnwards extends ParsedObject {
  private _overrideDivertTarget: DivertTargetValue | null = null;

  private _divertAfter: Divert | null = null;
  get divertAfter() {
    return this._divertAfter;
  }

  set divertAfter(value) {
    this._divertAfter = value;
    if (this._divertAfter) {
      this.AddContent(this._divertAfter);
    }
  }

  get typeName(): string {
    return "TunnelOnwards";
  }

  public readonly GenerateRuntimeObject = (): RuntimeObject => {
    const container = new RuntimeContainer();

    // Set override path for tunnel onwards (or nothing)
    container.AddContent(RuntimeControlCommand.EvalStart());

    if (this.divertAfter) {
      // Generate runtime object's generated code and steal the arguments runtime code
      const returnRuntimeObj = this.divertAfter.GenerateRuntimeObject();
      const returnRuntimeContainer = returnRuntimeObj as RuntimeContainer;
      if (returnRuntimeContainer) {
        // Steal all code for generating arguments from the divert
        const args = this.divertAfter.args;
        if (args !== null && args.length > 0) {
          // Steal everything betwen eval start and eval end
          let evalStart = -1;
          let evalEnd = -1;
          for (
            let ii = 0;
            ii < returnRuntimeContainer.content.length;
            ii += 1
          ) {
            const cmd = returnRuntimeContainer.content[
              ii
            ] as RuntimeControlCommand;
            if (cmd) {
              if (
                evalStart == -1 &&
                cmd.commandType === RuntimeControlCommand.CommandType.EvalStart
              ) {
                evalStart = ii;
              } else if (
                cmd.commandType === RuntimeControlCommand.CommandType.EvalEnd
              ) {
                evalEnd = ii;
              }
            }
          }

          for (let ii = evalStart + 1; ii < evalEnd; ii += 1) {
            const obj = returnRuntimeContainer.content[ii];
            obj.parent = null; // prevent error of being moved between owners
            container.AddContent(returnRuntimeContainer.content[ii]);
          }
        }
      }
      // Supply the divert target for the tunnel onwards target, either variable or more commonly, the explicit name
      // var returnDivertObj = returnRuntimeObj as Runtime.Divert;
      let returnDivertObj = asOrNull(returnRuntimeObj, RuntimeDivert);
      if (returnDivertObj != null && returnDivertObj.hasVariableTarget) {
        let runtimeVarRef = new VariableReference(
          returnDivertObj.variableDivertName
        );
        container.AddContent(runtimeVarRef);
      } else {
        this._overrideDivertTarget = new DivertTargetValue();
        container.AddContent(this._overrideDivertTarget);
      }
    } else {
      // No divert after tunnel onwards
      container.AddContent(new Void());
    }

    container.AddContent(RuntimeControlCommand.EvalEnd());
    container.AddContent(RuntimeControlCommand.PopTunnel());

    return container;
  };

  public ResolveReferences(context: Story): void {
    super.ResolveReferences(context);

    if (this.divertAfter && this.divertAfter.targetContent) {
      this._overrideDivertTarget!.targetPath =
        this.divertAfter.targetContent.runtimePath;
    }
  }

  public toString = (): string => {
    return ` -> ${this._divertAfter}`;
  };
}
