export class InfixOperator {
  constructor(
    public readonly type: string,
    public readonly precedence: number,
    public readonly requireWhitespace: boolean,
  )
  {}

  public readonly ToString = (): string => this.type;
}
