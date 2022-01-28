export class Argument {
  constructor(
    public name: string = '',
    public isByReference: boolean | null = null,
    public isDivertTarget: boolean | null = null,
  )
  {}
}
