// Taken from https://gist.github.com/blixt/f17b47c62508be59987b
// Ink uses a seedable PRNG of which there is none in native javascript.
export class PRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }
  public next(): number {
    return (this.seed = (this.seed * 48271) % 2147483647);
  }
  public nextFloat(): number {
    return (this.next() - 1) / 2147483646;
  }
}
