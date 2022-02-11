import { Divert as RuntimeDivert } from "../../../../engine/Divert";
import { InkObject as RuntimeObject } from "../../../../engine/Object";

export class SequenceDivertToResolve {
  constructor(
    public divert: RuntimeDivert,
    public targetContent: RuntimeObject
  ) {}
}
