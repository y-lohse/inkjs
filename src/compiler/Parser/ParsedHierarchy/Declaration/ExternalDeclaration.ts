import { INamedContent } from "../../../../engine/INamedContent";
import { ParsedObject } from "../Object";
import { InkObject as RuntimeObject } from "../../../../engine/Object";
import { Identifier } from "../Identifier";

export class ExternalDeclaration extends ParsedObject implements INamedContent {
  public get name(): string | null {
    return this.identifier?.name || null;
  }

  constructor(
    public readonly identifier: Identifier,
    public readonly argumentNames: string[]
  ) {
    super();
  }

  get typeName(): string {
    return "EXTERNAL";
  }

  public readonly GenerateRuntimeObject = (): RuntimeObject | null => {
    this.story.AddExternal(this);

    // No runtime code exists for an external, only metadata
    return null;
  };

  public toString(): string {
    return `EXTERNAL ${this.identifier?.name}`;
  }
}
