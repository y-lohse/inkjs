import { Path } from "./Path";
import { Container } from "./Container";
import { InkObject } from "./Object";

export class Pointer {
  public container: Container | null = null;
  public index: number = -1;

  constructor();
  constructor(container: Container | null, index: number);
  constructor() {
    if (arguments.length === 2) {
      this.container = arguments[0];
      this.index = arguments[1];
    }
  }

  public Resolve(): InkObject | null {
    if (this.index < 0) return this.container;
    if (this.container == null) return null;
    if (this.container.content.length == 0) return this.container;
    if (this.index >= this.container.content.length) return null;

    return this.container.content[this.index];
  }

  get isNull(): boolean {
    return this.container == null;
  }

  get path(): Path | null {
    if (this.isNull) return null;

    if (this.index >= 0)
      return this.container!.path.PathByAppendingComponent(
        new Path.Component(this.index)
      );
    else return this.container!.path;
  }

  public toString(): string {
    if (!this.container) return "Ink Pointer (null)";

    return (
      "Ink Pointer -> " +
      this.container.path.toString() +
      " -- index " +
      this.index
    );
  }

  // This method does not exist in the original C# code, but is here to maintain the
  // value semantics of Pointer.
  public copy(): Pointer {
    return new Pointer(this.container, this.index);
  }

  public static StartOf(container: Container | null): Pointer {
    return new Pointer(container, 0);
  }

  public static get Null(): Pointer {
    return new Pointer(null, -1);
  }
}
