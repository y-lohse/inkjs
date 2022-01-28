import { Container as RuntimeContainer } from '../../../../engine/Container';
import { ContentList } from '../ContentList';
import { Expression } from './Expression';
import { FlowBase } from '../Flow/FlowBase';
import { NativeFunctionCall } from '../../../../engine/NativeFunctionCall';
import { IntValue } from '../../../../engine/Value';
import { Story } from '../Story';
import { VariableAssignment as RuntimeVariableAssignment } from '../../../../engine/VariableAssignment';
import { VariableReference as RuntimeVariableReference } from '../../../../engine/VariableReference';
import { Weave } from '../Weave';

export class IncDecExpression extends Expression {
  private _runtimeAssignment: RuntimeVariableAssignment | null = null;

  public isInc: boolean;
  public expression: Expression | null = null;

  constructor(
    public readonly varName: string,
    isIncOrExpression: boolean | Expression,
    isInc?: boolean,
  ) {
    super();

    if (isIncOrExpression instanceof Expression) {
      this.expression = isIncOrExpression;
      this.AddContent(this.expression);
      this.isInc = Boolean(isInc);
    } else {
      this.isInc = isIncOrExpression as boolean;
    }
  }

  public readonly GenerateIntoContainer = (
    container: RuntimeContainer,
  ): void => {
    // x = x + y
    // ^^^ ^ ^ ^
    //  4  1 3 2
    // Reverse polish notation: (x 1 +) (assign to x)

    // 1.
    container.AddContent(new RuntimeVariableReference(this.varName));

    // 2.
    // - Expression used in the form ~ x += y
    // - Simple version: ~ x++
    if (this.expression) {
      this.expression.GenerateIntoContainer(container);
    } else {
      container.AddContent(new IntValue(1));
    }

    // 3.
    container.AddContent(
      NativeFunctionCall.CallWithName(this.isInc ? '+' : '-'),
    );

    // 4.
    this._runtimeAssignment = new RuntimeVariableAssignment(this.varName, false);
    container.AddContent(this._runtimeAssignment);
  };

  public readonly ResolveReferences = (context: Story): void => {
    super.ResolveReferences(context);

    const varResolveResult = context.ResolveVariableWithName(
      this.varName,
      this,
    );

    if (!varResolveResult.found) {
      this.Error(
        `variable for ${this.incrementDecrementWord} could not be found: '${this.varName}' after searching: ${this.descriptionOfScope}`,
      );
    }

    if (!this._runtimeAssignment) {
      throw new Error();
    }

    this._runtimeAssignment.isGlobal = varResolveResult.isGlobal;

    if (!(parent instanceof Weave) &&
      !(parent instanceof FlowBase) &&
      !(parent instanceof ContentList))
    {
      this.Error(`Can't use ${this.incrementDecrementWord} as sub-expression`);
    }
  };

  get incrementDecrementWord(): 'increment' | 'decrement' {
    if (this.isInc) {
        return 'increment';
    }

    return 'decrement';
  }

  public readonly ToString = (): string => {
    if (this.expression) {
      return `${this.varName}${this.isInc ? ' += ' : ' -= '}${this.expression.ToString()}`;
    }

    return this.varName + (this.isInc ? "++" : "--");
  };
}
