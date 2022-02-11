import { Divert as RuntimeDivert } from "../../../../engine/Divert";
import { InkObject as RuntimeObject } from "../../../../engine/Object";

export class GatherPointToResolve {
  constructor(
    public divert: RuntimeDivert,
    public targetRuntimeObj: RuntimeObject
  ) {}
}
