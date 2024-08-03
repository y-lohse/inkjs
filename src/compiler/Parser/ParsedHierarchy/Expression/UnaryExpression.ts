import { Container as RuntimeContainer } from "../../../../engine/Container";
import { Expression } from "./Expression";
import { NativeFunctionCall } from "../../../../engine/NativeFunctionCall";
import { NumberExpression } from "./NumberExpression";
import { asOrNull } from "../../../../engine/TypeAssertion";

export class UnaryExpression extends Expression {
  get nativeNameForOp(): string {
    // Replace "-" with "_" to make it unique (compared to subtraction)
    if (this.op === "-") {
      return "_";
    } else if (this.op === "not") {
      return "!";
    }

    return this.op;
  }

  public innerExpression: Expression;

  // Attempt to flatten inner expression immediately
  // e.g. convert (-(5)) into (-5)
  public static readonly WithInner = (
    inner: Expression,
    op: string
  ): Expression => {
    const innerNumber = asOrNull(inner, NumberExpression);

    if (innerNumber) {
      if (op === "-") {
        if (innerNumber.isInt()) {
          return new NumberExpression(-innerNumber.value, "int");
        } else if (innerNumber.isFloat()) {
          return new NumberExpression(-innerNumber.value, "float");
        }
      } else if (op == "!" || op == "not") {
        if (innerNumber.isInt()) {
          return new NumberExpression(innerNumber.value == 0, "bool");
        } else if (innerNumber.isFloat()) {
          return new NumberExpression(innerNumber.value == 0.0, "bool");
        } else if (innerNumber.isBool()) {
          return new NumberExpression(!innerNumber.value, "bool");
        }
      }

      throw new Error("Unexpected operation or number type");
    }

    // Normal fallback
    const unary = new UnaryExpression(inner, op);

    return unary;
  };

  constructor(
    inner: Expression,
    public readonly op: string
  ) {
    super();

    this.innerExpression = this.AddContent(inner) as Expression;
  }

  get typeName(): string {
    return "UnaryExpression";
  }

  public readonly GenerateIntoContainer = (container: RuntimeContainer) => {
    this.innerExpression.GenerateIntoContainer(container);
    container.AddContent(NativeFunctionCall.CallWithName(this.nativeNameForOp));
  };

  public readonly toString = (): string =>
    this.nativeNameForOp + this.innerExpression;
}
