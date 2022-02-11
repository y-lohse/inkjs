import { DebugMetadata } from "../engine/DebugMetadata";

export class DebugSourceRange {
  constructor(
    public readonly length: number,
    public readonly debugMetadata: DebugMetadata | null,
    public text: string
  ) {}
}
