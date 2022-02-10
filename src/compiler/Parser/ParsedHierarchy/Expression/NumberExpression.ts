import { Container as RuntimeContainer } from '../../../../engine/Container';
import { Expression } from './Expression';
import { BoolValue, FloatValue, IntValue } from '../../../../engine/Value';

export class NumberExpression extends Expression {
  public value: number|boolean;
  public subtype: 'int'|'float'|'bool';
  
  constructor(value: number|boolean, subtype: 'int'|'float'|'bool') {
    super();

    if (typeof value === 'number' && !Number.isNaN(value) || typeof value == 'boolean') {
      this.value = value;
      this.subtype = subtype;
    } else {
      throw new Error('Unexpected object type in NumberExpression.');
    }
  }

  public isInt= ():boolean => (this.subtype == 'int')

  public isFloat= ():boolean => (this.subtype == 'float')

  public isBool= ():boolean => (this.subtype == 'bool')

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

