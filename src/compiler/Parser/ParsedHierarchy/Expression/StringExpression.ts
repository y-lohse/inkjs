import { Container as RuntimeContainer } from "../../../../engine/Container";
import { ControlCommand as RuntimeControlCommand } from "../../../../engine/ControlCommand";
import { Expression } from "./Expression";
import { ParsedObject } from "../Object";
import { Text } from "../Text";
import { asOrNull } from "../../../../engine/TypeAssertion";

export class StringExpression extends Expression {
  get isSingleString() {
    if (this.content.length !== 1) {
      return false;
    }

    const c = this.content[0];
    if (!(c instanceof Text)) {
      return false;
    }

    return true;
  }

  constructor(content: ParsedObject[]) {
    super();

    this.AddContent(content);
  }

  get typeName(): string {
    return "String";
  }

  public readonly GenerateIntoContainer = (
    container: RuntimeContainer
  ): void => {
    container.AddContent(RuntimeControlCommand.BeginString());

    for (const c of this.content) {
      container.AddContent(c.runtimeObject);
    }

    container.AddContent(RuntimeControlCommand.EndString());
  };

  public readonly toString = (): string => {
    let sb = "";
    for (const c of this.content) {
      sb += c;
    }

    return sb;
  };

  // Equals override necessary in order to check for CONST multiple definition equality
  public Equals(obj: ParsedObject): boolean {
    const otherStr = asOrNull(obj, StringExpression);
    if (otherStr === null) {
      return false;
    }

    // Can only compare direct equality on single strings rather than
    // complex string expressions that contain dynamic logic
    if (!this.isSingleString || !otherStr.isSingleString) {
      return false;
    }

    const thisTxt = this.toString();
    const otherTxt = otherStr.toString();
    return thisTxt === otherTxt;
  }
}
