// This is simple replacement of the Stopwatch class from the .NET Framework.
// The original class can count time with much more accuracy than the Javascript version.
// It might be worth considering using `window.performance` in the browser
// or `process.hrtime()` in node.
export class Stopwatch {
  private startTime: number | undefined;

  constructor() {
    this.startTime = undefined;
  }

  get ElapsedMilliseconds(): number {
    if (typeof this.startTime === "undefined") {
      return 0;
    }
    return new Date().getTime() - this.startTime;
  }

  public Start() {
    this.startTime = new Date().getTime();
  }
  public Stop() {
    this.startTime = undefined;
  }
}
