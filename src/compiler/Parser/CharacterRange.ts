import { CharacterSet } from "./CharacterSet";

/// <summary>
/// A class representing a character range. Allows for lazy-loading a corresponding <see cref="CharacterSet">character set</see>.
/// </summary>
export class CharacterRange {
  public static Define = (
    start: string,
    end: string,
    excludes: string[] | CharacterSet = []
  ): CharacterRange => new CharacterRange(start, end, excludes);

  private _correspondingCharSet: CharacterSet = new CharacterSet();
  private _excludes = new Set<string>();

  constructor(
    private _start: string,
    private _end: string,
    excludes: string[] | CharacterSet = []
  ) {
    if (excludes instanceof CharacterSet) {
      this._excludes = excludes.set;
    } else {
      for (const item of excludes) {
        this._excludes.add(item);
      }
    }
  }

  get start(): string {
    return this._start;
  }

  get end(): string {
    return this._end;
  }

  /// <summary>
  /// Returns a <see cref="CharacterSet">character set</see> instance corresponding to the character range
  /// represented by the current instance.
  /// </summary>
  /// <remarks>
  /// The internal character set is created once and cached in memory.
  /// </remarks>
  /// <returns>The char set.</returns>
  public readonly ToCharacterSet = (): CharacterSet => {
    if (this._correspondingCharSet.set.size === 0) {
      for (
        let ii = this.start.charCodeAt(0), c;
        ii <= this.end.charCodeAt(0);
        ii += 1
      ) {
        c = String.fromCharCode(ii);
        if (!this._excludes.has(c)) {
          this._correspondingCharSet.AddCharacters(c);
        }
      }
    }

    return this._correspondingCharSet;
  };
}
