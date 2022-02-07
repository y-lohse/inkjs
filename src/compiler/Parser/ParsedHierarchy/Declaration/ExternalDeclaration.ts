import { INamedContent } from '../../../../engine/INamedContent';
import { ParsedObject } from '../Object';
import { InkObject as RuntimeObject } from '../../../../engine/Object';
import { Identifier } from '../Identifier';

export class ExternalDeclaration extends ParsedObject implements INamedContent {
  
  public get  name(): string | undefined{
    return this.identifier?.name;
  }
  
  constructor (
    public readonly identifier: Identifier,
    public readonly argumentNames: string[],
  )
  {
    super();
  }

  public readonly GenerateRuntimeObject = (): RuntimeObject | null => {
    this.story.AddExternal(this);

    // No runtime code exists for an external, only metadata
    return null;
  };
}

