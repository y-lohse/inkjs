import { Container as RuntimeContainer } from '../../../../engine/Container';
import { Expression } from './Expression';
import { NativeFunctionCall } from '../../../../engine/NativeFunctionCall';

export class UnaryExpression extends Expression {
  get nativeNameForOp(): string {
    // Replace "-" with "_" to make it unique (compared to subtraction)
    if (this.op === '-') {
      return '_';
    } else if (this.op === 'not') {
      return '!';
    }

    return this.op;
  }

  public innerExpression: Expression;

  // Attempt to flatten inner expression immediately
  // e.g. convert (-(5)) into (-5)
  public static readonly WithInner = (
    inner: Expression,
    op: string,
  ): Expression | number => {
    const innerNumber = Number(inner);
    if (!Number.isNaN(innerNumber)) {
      if (op === '-') {
        return -Number(innerNumber as any);
      } else if (op === '!' || op === 'not') {
        return innerNumber === 0 ? 1 : 0;
      }

      throw new Error('Unexpected operation or number type');
    }

    // Normal fallback
    const unary = new UnaryExpression(inner, op);

    return unary;
  };

  constructor(
    inner: Expression,
    public readonly op: string,
  ) {
    super();

    this.innerExpression = this.AddContent(inner);
  }

  public readonly GenerateIntoContainer = (container: RuntimeContainer) => {
    this.innerExpression.GenerateIntoContainer(container);
    container.AddContent(NativeFunctionCall.CallWithName(this.nativeNameForOp));
  };

  public readonly ToString = (): string => (
    this.nativeNameForOp + this.innerExpression
  );
}
