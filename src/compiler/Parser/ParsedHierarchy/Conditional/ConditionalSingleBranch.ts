import { Container as RuntimeContainer } from "../../../../engine/Container";
import { ControlCommand as RuntimeControlCommand } from "../../../../engine/ControlCommand";
import { Divert as RuntimeDivert } from "../../../../engine/Divert";
import { Expression } from "../Expression/Expression";
import { ParsedObject } from "../Object";
import { InkObject as RuntimeObject } from "../../../../engine/Object";
import { NativeFunctionCall } from "../../../../engine/NativeFunctionCall";
import { StringValue } from "../../../../engine/Value";
import { Story } from "../Story";
import { Text } from "../Text";
import { Weave } from "../Weave";
import { asOrNull } from "../../../../engine/TypeAssertion";

export class ConditionalSingleBranch extends ParsedObject {
  public _contentContainer: RuntimeContainer | null = null;
  public _conditionalDivert: RuntimeDivert | null = null;
  public _ownExpression: Expression | null = null;
  public _innerWeave: Weave | null = null;
  // bool condition, e.g.:
  // { 5 == 4:
  //   - the true branch
  //   - the false branch
  // }
  public isTrueBranch: boolean = false;

  // When each branch has its own expression like a switch statement,
  // this is non-null. e.g.
  // { x:
  //    - 4: the value of x is four (ownExpression is the value 4)
  //    - 3: the value of x is three
  // }
  get ownExpression() {
    return this._ownExpression;
  }

  set ownExpression(value) {
    this._ownExpression = value;
    if (this._ownExpression) {
      this.AddContent(this._ownExpression);
    }
  }

  // In the above example, match equality of x with 4 for the first branch.
  // This is as opposed to simply evaluating boolean equality for each branch,
  // example when shouldMatchEquality is FALSE:
  // {
  //    3 > 2:  This will happen
  //    2 > 3:  This won't happen
  // }
  public matchingEquality: boolean = false;

  public isElse: boolean = false;
  public isInline: boolean = false;

  public returnDivert: RuntimeDivert | null = null;

  constructor(content?: ParsedObject[] | null | undefined) {
    super();

    // Branches are allowed to be empty
    if (content) {
      this._innerWeave = new Weave(content);
      this.AddContent(this._innerWeave);
    }
  }

  get typeName(): string {
    return "ConditionalSingleBranch";
  }

  // Runtime content can be summarised as follows:
  //  - Evaluate an expression if necessary to branch on
  //  - Branch to a named container if true
  //       - Divert back to main flow
  //         (owner Conditional is in control of this target point)
  public readonly GenerateRuntimeObject = (): RuntimeObject => {
    // Check for common mistake, of putting "else:" instead of "- else:"
    if (this._innerWeave) {
      for (const c of this._innerWeave.content) {
        const text = asOrNull(c, Text);
        if (text) {
          // Don't need to trim at the start since the parser handles that already
          if (text.text.startsWith("else:")) {
            this.Warning(
              "Saw the text 'else:' which is being treated as content. Did you mean '- else:'?",
              text
            );
          }
        }
      }
    }

    const container = new RuntimeContainer();

    // Are we testing against a condition that's used for more than just this
    // branch? If so, the first thing we need to do is replicate the value that's
    // on the evaluation stack so that we don't fully consume it, in case other
    // branches need to use it.
    const duplicatesStackValue: boolean = this.matchingEquality && !this.isElse;

    if (duplicatesStackValue) {
      container.AddContent(RuntimeControlCommand.Duplicate());
    }

    this._conditionalDivert = new RuntimeDivert();

    // else clause is unconditional catch-all, otherwise the divert is conditional
    this._conditionalDivert.isConditional = !this.isElse;

    // Need extra evaluation?
    if (!this.isTrueBranch && !this.isElse) {
      const needsEval: boolean = this.ownExpression !== null;
      if (needsEval) {
        container.AddContent(RuntimeControlCommand.EvalStart());
      }

      if (this.ownExpression) {
        this.ownExpression.GenerateIntoContainer(container);
      }

      // Uses existing duplicated value
      if (this.matchingEquality) {
        container.AddContent(NativeFunctionCall.CallWithName("=="));
      }

      if (needsEval) {
        container.AddContent(RuntimeControlCommand.EvalEnd());
      }
    }

    // Will pop from stack if conditional
    container.AddContent(this._conditionalDivert);

    this._contentContainer = this.GenerateRuntimeForContent();
    this._contentContainer.name = "b";

    // Multi-line conditionals get a newline at the start of each branch
    // (as opposed to the start of the multi-line conditional since the condition
    //  may evaluate to false.)
    if (!this.isInline) {
      this._contentContainer.InsertContent(new StringValue("\n"), 0);
    }

    if (duplicatesStackValue || (this.isElse && this.matchingEquality)) {
      this._contentContainer.InsertContent(
        RuntimeControlCommand.PopEvaluatedValue(),
        0
      );
    }

    container.AddToNamedContentOnly(this._contentContainer);

    this.returnDivert = new RuntimeDivert();
    this._contentContainer.AddContent(this.returnDivert);

    return container;
  };

  public readonly GenerateRuntimeForContent = (): RuntimeContainer => {
    // Empty branch - create empty container
    if (this._innerWeave === null) {
      return new RuntimeContainer();
    }

    return this._innerWeave.rootContainer;
  };

  public ResolveReferences(context: Story): void {
    if (!this._conditionalDivert || !this._contentContainer) {
      throw new Error();
    }

    this._conditionalDivert.targetPath = this._contentContainer.path;
    super.ResolveReferences(context);
  }
}
