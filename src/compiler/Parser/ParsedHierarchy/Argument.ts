import { Identifier } from "./Identifier";

export class Argument {
  constructor(
    public identifier: Identifier | null = null,
    public isByReference: boolean | null = null,
    public isDivertTarget: boolean | null = null
  ) {}

  get typeName(): string {
    return "Argument";
  }
}
