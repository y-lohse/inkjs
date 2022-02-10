import { Container as RuntimeContainer } from '../../../../engine/Container';
import { Expression } from './Expression';
import { BoolValue, FloatValue, IntValue } from '../../../../engine/Value';

export class NumberExpression extends Expression {
  public value: number|boolean;
  
  constructor(value: number|boolean) {
    super();

    if (typeof value === 'number' && !Number.isNaN(value)) {
      this.value = value;
    } else {
      throw new Error('Unexpected object type in NumberExpression.');
    }
  }

  public isInt= ():boolean => (
    typeof this.value == 'number' &&
        !Number.isNaN(this.value) &&
        this.value % 1 === 0
  )

  public isFloat= ():boolean => (
    typeof this.value == 'number' &&
        !Number.isNaN(this.value)
  )

  public isBool= ():boolean => (
    typeof this.value == 'boolean'
  )

  public readonly GenerateIntoContainer = (
    container: RuntimeContainer,
  ): void => {
    if (this.isInt()) {
      container.AddContent(new IntValue(this.value as number));
    }else if (this.isFloat()) {
      container.AddContent(new FloatValue(this.value as number ));
    } else if (this.isBool()) {
      container.AddContent(new BoolValue(this.value as boolean));
    }
  }

  public readonly toString = (): string => (
    String(this.value)
  );
}

