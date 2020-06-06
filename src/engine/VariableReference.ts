import { InkObject } from "./Object";
import { Path } from "./Path";

export class VariableReference extends InkObject {
  public name: string | null;
  public pathForCount: Path | null = null;

  get containerForCount() {
    if (this.pathForCount === null) return null;
    return this.ResolvePath(this.pathForCount).container;
  }
  get pathStringForCount() {
    if (this.pathForCount === null) return null;

    return this.CompactPathString(this.pathForCount);
  }
  set pathStringForCount(value: string | null) {
    if (value === null) this.pathForCount = null;
    else this.pathForCount = new Path(value);
  }

  constructor(name: string | null = null) {
    super();
    this.name = name;
  }

  public toString() {
    if (this.name != null) {
      return "var(" + this.name + ")";
    } else {
      let pathStr = this.pathStringForCount;
      return "read_count(" + pathStr + ")";
    }
  }
}
