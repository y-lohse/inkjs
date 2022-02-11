export class CharacterSet {
  public static readonly FromRange = (
    start: string,
    end: string
  ): CharacterSet => new CharacterSet().AddRange(start, end);

  public set: Set<string> = new Set<string>();

  constructor(arg?: string | string[] | CharacterSet) {
    if (arg) {
      this.AddCharacters(arg);
    }
  }

  public readonly Add = (arg: string) => this.set.add(arg);

  public readonly AddRange = (start: string, end: string): CharacterSet => {
    for (let c = start.charCodeAt(0); c <= end.charCodeAt(0); ++c) {
      this.Add(String.fromCharCode(c));
    }

    return this;
  };

  public readonly AddCharacters = (
    chars: string | string[] | CharacterSet
  ): CharacterSet => {
    if (typeof chars === "string" || Array.isArray(chars)) {
      for (const c of chars) {
        this.Add(c);
      }
    } else {
      for (const c of chars.set) {
        this.Add(c);
      }
    }

    return this;
  };
}
