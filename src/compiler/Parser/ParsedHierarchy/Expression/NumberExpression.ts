import { Container as RuntimeContainer } from "../../../../engine/Container";
import { Expression } from "./Expression";
import { BoolValue, FloatValue, IntValue } from "../../../../engine/Value";
import { asOrNull } from "../../../../engine/TypeAssertion";
import { ParsedObject } from "../Object";

// This class is named Number in the C# codebase
// but this conflict with the built-in Number class
export class NumberExpression extends Expression {
  public value: number | boolean;
  public subtype: "int" | "float" | "bool";

  constructor(value: number | boolean, subtype: "int" | "float" | "bool") {
    super();

    if (
      (typeof value === "number" && !Number.isNaN(value)) ||
      typeof value == "boolean"
    ) {
      this.value = value;
      this.subtype = subtype;
    } else {
      throw new Error("Unexpected object type in NumberExpression.");
    }
  }

  get typeName(): string {
    return "Number";
  }

  public isInt = (): boolean => this.subtype == "int";

  public isFloat = (): boolean => this.subtype == "float";

  public isBool = (): boolean => this.subtype == "bool";

  public readonly GenerateIntoContainer = (
    container: RuntimeContainer
  ): void => {
    if (this.isInt()) {
      container.AddContent(new IntValue(this.value as number));
    } else if (this.isFloat()) {
      container.AddContent(new FloatValue(this.value as number));
    } else if (this.isBool()) {
      container.AddContent(new BoolValue(this.value as boolean));
    }
  };

  public readonly toString = (): string => String(this.value);

  public Equals(obj: ParsedObject): boolean {
    const numberExpression = asOrNull(obj, NumberExpression);
    if (!numberExpression) return false;

    return (
      numberExpression.subtype == this.subtype &&
      numberExpression.value == this.value
    );
  }
}
