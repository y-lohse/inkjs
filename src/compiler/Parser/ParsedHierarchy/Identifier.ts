import { DebugMetadata } from "../../../engine/DebugMetadata";

export class Identifier {
  public name: string;
  public debugMetadata: DebugMetadata | null = null;

  constructor(name: string) {
    this.name = name;
  }

  get typeName(): string {
    return "Identifier";
  }

  public static Done(): Identifier {
    return new Identifier("DONE");
  }

  public readonly toString = (): string => this.name || "undefined identifer";
}
