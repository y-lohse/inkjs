import { Argument } from './ParsedHierarchy/Argument';

export class FlowDecl {
  constructor(
    public readonly name: string,
    public readonly args: Argument[],
    public readonly isFunction: boolean)
  {
  }
}
