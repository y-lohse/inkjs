import { INamedContent } from '../../../../engine/INamedContent';
import { ParsedObject } from '../Object';
import { InkObject as RuntimeObject } from '../../../../engine/Object';

export class ExternalDeclaration extends ParsedObject implements INamedContent {
  constructor (
    public readonly name: string,
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

