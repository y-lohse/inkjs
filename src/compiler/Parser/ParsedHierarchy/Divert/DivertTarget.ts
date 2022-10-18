import { BinaryExpression } from "../Expression/BinaryExpression";
import { Choice } from "../Choice";
import { Conditional } from "../Conditional/Conditional";
import { ConditionalSingleBranch } from "../Conditional/ConditionalSingleBranch";
import { Container as RuntimeContainer } from "../../../../engine/Container";
import { ParsedObject } from "../Object";
import { Divert } from "./Divert";
import { Divert as RuntimeDivert } from "../../../../engine/Divert";
import { DivertTargetValue } from "../../../../engine/Value";
import { Expression } from "../Expression/Expression";
import { FlowBase } from "../Flow/FlowBase";
import { FunctionCall } from "../FunctionCall";
import { MultipleConditionExpression } from "../Expression/MultipleConditionExpression";
import { Story } from "../Story";
import { VariableReference } from "../Variable/VariableReference";
import { asOrNull } from "../../../../engine/TypeAssertion";

export class DivertTarget extends Expression {
  private _runtimeDivert: RuntimeDivert | null = null;
  get runtimeDivert(): RuntimeDivert {
    if (!this._runtimeDivert) {
      throw new Error();
    }

    return this._runtimeDivert;
  }

  private _runtimeDivertTargetValue: DivertTargetValue | null = null;
  get runtimeDivertTargetValue(): DivertTargetValue {
    if (!this._runtimeDivertTargetValue) {
      throw new Error();
    }

    return this._runtimeDivertTargetValue;
  }

  public divert: Divert;

  constructor(divert: Divert) {
    super();

    this.divert = this.AddContent(divert) as Divert;
  }

  get typeName(): string {
    return "DivertTarget";
  }

  public readonly GenerateIntoContainer = (
    container: RuntimeContainer
  ): void => {
    this.divert.GenerateRuntimeObject();

    this._runtimeDivert = this.divert.runtimeDivert as RuntimeDivert;
    this._runtimeDivertTargetValue = new DivertTargetValue();

    container.AddContent(this.runtimeDivertTargetValue);
  };

  public ResolveReferences(context: Story): void {
    super.ResolveReferences(context);

    if (this.divert.isDone || this.divert.isEnd) {
      this.Error(
        `Can't use -> DONE or -> END as variable divert targets`,
        this
      );

      return;
    }

    let usageContext: ParsedObject | null = this;
    while (usageContext && usageContext instanceof Expression) {
      let badUsage: boolean = false;
      let foundUsage: boolean = false;

      const usageParent: any = (usageContext as Expression).parent;
      if (usageParent instanceof BinaryExpression) {
        // Only allowed to compare for equality

        const binaryExprParent = usageParent;
        if (
          binaryExprParent.opName !== "==" &&
          binaryExprParent.opName !== "!="
        ) {
          badUsage = true;
        } else {
          if (
            !(
              binaryExprParent.leftExpression instanceof DivertTarget ||
              binaryExprParent.leftExpression instanceof VariableReference
            )
          ) {
            badUsage = true;
          } else if (
            !(
              binaryExprParent.rightExpression instanceof DivertTarget ||
              binaryExprParent.rightExpression instanceof VariableReference
            )
          ) {
            badUsage = true;
          }
        }

        foundUsage = true;
      } else if (usageParent instanceof FunctionCall) {
        const funcCall = usageParent;
        if (!funcCall.isTurnsSince && !funcCall.isReadCount) {
          badUsage = true;
        }

        foundUsage = true;
      } else if (usageParent instanceof Expression) {
        badUsage = true;
        foundUsage = true;
      } else if (usageParent instanceof MultipleConditionExpression) {
        badUsage = true;
        foundUsage = true;
      } else if (
        usageParent instanceof Choice &&
        (usageParent as Choice).condition === usageContext
      ) {
        badUsage = true;
        foundUsage = true;
      } else if (
        usageParent instanceof Conditional ||
        usageParent instanceof ConditionalSingleBranch
      ) {
        badUsage = true;
        foundUsage = true;
      }

      if (badUsage) {
        this.Error(
          `Can't use a divert target like that. Did you intend to call '${this.divert.target}' as a function: likeThis(), or check the read count: likeThis, with no arrows?`,
          this
        );
      }

      if (foundUsage) {
        break;
      }

      usageContext = usageParent;
    }

    // Example ink for this case:
    //
    //     VAR x = -> blah
    //
    // ...which means that "blah" is expected to be a literal stitch target rather
    // than a variable name. We can't really intelligently recover from this (e.g. if blah happens to
    // contain a divert target itself) since really we should be generating a variable reference
    // rather than a concrete DivertTarget, so we list it as an error.
    if (this.runtimeDivert.hasVariableTarget) {
      if (!this.divert.target) {
        throw new Error();
      }

      this.Error(
        `Since '${this.divert.target.dotSeparatedComponents}' is a variable, it shouldn't be preceded by '->' here.`
      );
    }

    // Main resolve
    this.runtimeDivert.targetPath &&
      (this.runtimeDivertTargetValue.targetPath =
        this.runtimeDivert.targetPath);

    // Tell hard coded (yet variable) divert targets that they also need to be counted
    // TODO: Only detect DivertTargets that are values rather than being used directly for
    // read or turn counts. Should be able to detect this by looking for other uses of containerForCounting
    let targetContent = this.divert.targetContent;
    if (targetContent !== null) {
      let target = targetContent.containerForCounting;
      if (target !== null) {
        // Purpose is known: used directly in TURNS_SINCE(-> divTarg)
        const parentFunc = asOrNull(this.parent, FunctionCall);
        if (parentFunc && parentFunc.isTurnsSince) {
          target.turnIndexShouldBeCounted = true;
        } else {
          // Unknown purpose, count everything
          target.visitsShouldBeCounted = true;
          target.turnIndexShouldBeCounted = true;
        }
      }

      // Unfortunately not possible:
      // https://github.com/inkle/ink/issues/538
      //
      // VAR func = -> double
      //
      // === function double(ref x)
      //    ~ x = x * 2
      //
      // Because when generating the parameters for a function
      // to be called, it needs to know ahead of time when
      // compiling whether to pass a variable reference or value.
      //
      let targetFlow = asOrNull(targetContent, FlowBase);
      if (targetFlow != null && targetFlow.args !== null) {
        for (const arg of targetFlow.args) {
          if (arg.isByReference) {
            this.Error(
              `Can't store a divert target to a knot or function that has by-reference arguments ('${targetFlow.identifier}' has 'ref ${arg.identifier}').`
            );
          }
        }
      }
    }
  }

  // Equals override necessary in order to check for CONST multiple definition equality
  public readonly Equals = (obj: ParsedObject): boolean => {
    const otherDivTarget = asOrNull(obj, DivertTarget);
    if (
      !otherDivTarget ||
      !this.divert.target ||
      !otherDivTarget.divert.target
    ) {
      return false;
    }

    const targetStr = this.divert.target.dotSeparatedComponents;
    const otherTargetStr = otherDivTarget.divert.target.dotSeparatedComponents;

    return targetStr === otherTargetStr;
  };
}
