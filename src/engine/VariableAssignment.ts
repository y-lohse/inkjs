import { InkObject } from "./Object";

export class VariableAssignment extends InkObject {
  public readonly variableName: string | null;
  public readonly isNewDeclaration: boolean;
  public isGlobal: boolean;

  constructor(variableName: string | null, isNewDeclaration: boolean) {
    super();
    this.variableName = variableName || null;
    this.isNewDeclaration = !!isNewDeclaration;
    this.isGlobal = false;
  }

  public toString(): string {
    return "VarAssign to " + this.variableName;
  }
}
