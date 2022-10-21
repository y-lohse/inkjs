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
}
