import { Container as RuntimeContainer } from '../../../../engine/Container';
import { Expression } from './Expression';
import { NativeFunctionCall } from '../../../../engine/NativeFunctionCall';
import { Story } from '../Story';
import { UnaryExpression } from './UnaryExpression';

export class BinaryExpression extends Expression {
  public readonly leftExpression: Expression;
  public readonly rightExpression: Expression;

  constructor(
    left: Expression,
    right: Expression,
    public opName: string,
  ) {
    super();

    this.leftExpression = this.AddContent(left);
    this.rightExpression = this.AddContent(right);

    this.opName = opName;
  }

  public readonly GenerateIntoContainer = (container: RuntimeContainer) => {
    this.leftExpression.GenerateIntoContainer(container);
    this.rightExpression.GenerateIntoContainer(container);
    this.opName = this.NativeNameForOp(this.opName);
    container.AddContent(NativeFunctionCall.CallWithName(this.opName));
  };

  public ResolveReferences = (context: Story): void => {
    super.ResolveReferences(context);

    // Check for the following case:
    //
    //    (not A) ? B
    //
    // Since this easy to accidentally do:
    //
    //    not A ? B
    //
    // when you intend:
    //
    //    not (A ? B)
    if (this.NativeNameForOp(this.opName) === '?') {
      const leftUnary = this.leftExpression as UnaryExpression;
      if (leftUnary !== null &&
        (leftUnary.op === 'not' || leftUnary.op === '!'))
      {
        this.Error(
          `Using 'not' or '!' here negates '${leftUnary.innerExpression}' rather than the result of the '?' or 'has' operator. You need to add parentheses around the (A ? B) expression.`,
        );
      }
    }
  };

  public readonly NativeNameForOp = (opName: string): string => {
    if (opName === 'and') {
      return '&&';
    } else if (opName === 'or') {
      return '||';
    } else if (opName === 'mod') {
      return '%';
    } else if (opName === 'has') {
      return '?';
    } else if (opName === 'hasnt') {
      return '!?';
    }
    
    return opName;
  };

  public readonly ToString = (): string => (
    `(${this.leftExpression} ${this.opName} ${this.rightExpression})`
  );
}