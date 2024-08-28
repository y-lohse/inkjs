import { Path } from "./Path";
import { CallStack } from "./CallStack";
import { throwNullException } from "./NullException";
import { InkObject } from "./Object";

export class Choice extends InkObject {
  public text: string = "";
  public index: number = 0;
  public threadAtGeneration: CallStack.Thread | null = null;
  public sourcePath: string = "";
  public targetPath: Path | null = null;
  public isInvisibleDefault: boolean = false;
  public tags: string[] | null = null;
  public originalThreadIndex: number = 0;

  get pathStringOnChoice(): string {
    if (this.targetPath === null)
      return throwNullException("Choice.targetPath");
    return this.targetPath.toString();
  }
  set pathStringOnChoice(value: string) {
    this.targetPath = new Path(value);
  }

  public Clone() {
    let copy = new Choice();
    copy.text = this.text;
    copy.sourcePath = this.sourcePath;
    copy.index = this.index;
    copy.targetPath = this.targetPath;
    copy.originalThreadIndex = this.originalThreadIndex;
    copy.isInvisibleDefault = this.isInvisibleDefault;
    if (this.threadAtGeneration !== null)
      copy.threadAtGeneration = this.threadAtGeneration.Copy();

    return copy;
  }
}
