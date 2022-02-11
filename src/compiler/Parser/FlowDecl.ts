import { Argument } from "./ParsedHierarchy/Argument";
import { Identifier } from "./ParsedHierarchy/Identifier";

export class FlowDecl {
  constructor(
    public readonly name: Identifier,
    public readonly args: Argument[],
    public readonly isFunction: boolean
  ) {}
}
