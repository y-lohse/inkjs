import { Container as RuntimeContainer } from "../../../../engine/Container";
import { Expression } from "./Expression";
import { NativeFunctionCall } from "../../../../engine/NativeFunctionCall";

export class MultipleConditionExpression extends Expression {
  get subExpressions(): Expression[] {
    return this.content as Expression[];
  }

  constructor(conditionExpressions: Expression[]) {
    super();

    this.AddContent(conditionExpressions);
  }

  get typeName(): string {
    return "MultipleConditionExpression";
  }

  public readonly GenerateIntoContainer = (
    container: RuntimeContainer
  ): void => {
    //    A && B && C && D
    // => (((A B &&) C &&) D &&) etc
    let isFirst: boolean = true;
    for (const conditionExpr of this.subExpressions) {
      conditionExpr.GenerateIntoContainer(container);

      if (!isFirst) {
        container.AddContent(NativeFunctionCall.CallWithName("&&"));
      }

      isFirst = false;
    }
  };
}
