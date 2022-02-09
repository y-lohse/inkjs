import { Container as RuntimeContainer } from '../../../engine/Container';
import { Expression } from './Expression/Expression';
import { FloatValue, IntValue } from '../../../engine/Value';

export class NumberType extends Expression {
  public value: number;
  
  constructor(value: number) {
    super();

    if (typeof value === 'number' && !Number.isNaN(value)) {
      this.value = value;
    } else {
      throw new Error('Unexpected object type in NumberType.');
    }
  }

  public readonly GenerateIntoContainer = (
    container: RuntimeContainer,
  ): void => {
    if (this.value % 1 === 0) {
      container.AddContent(new IntValue(this.value));
    } else {
      container.AddContent(new FloatValue(this.value));
    }
  }

  public readonly toString = (): string => (
    String(this.value)
  );
}

