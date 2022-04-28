import { ParsedObject } from "./Object";

export class AuthorWarning extends ParsedObject {
  constructor(public readonly warningMessage: string) {
    super();
  }

  get typeName(): string {
    return "AuthorWarning";
  }

  public readonly GenerateRuntimeObject = (): null => {
    this.Warning(this.warningMessage);
    return null;
  };
}
