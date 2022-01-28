import { ListDefinition } from './ListDefinition';
import { ParsedObject } from '../Object';
import { InkObject as RuntimeObject } from '../../../../engine/Object';
import { Story } from '../Story';
import { SymbolType } from '../SymbolType';

export class ListElementDefinition extends ParsedObject {
  public seriesValue: number = 0;

  public parent: ListDefinition | null = null;

  get fullName(): string {
    const parentList = this.parent;
    if (parentList === null) {
      throw new Error('Can\'t get full name without a parent list.');
    }

    return `${parentList.name}.${this.name}`;
  }

  get typeName(): string {
    return 'List element';
  }

  constructor(
    public readonly name: string,
    public readonly inInitialList: boolean,
    public readonly explicitValue: number | null = null,
  ) {
    super();
    this.parent = super.parent as ListDefinition;
  }

  public readonly GenerateRuntimeObject = (): RuntimeObject => {
    throw new Error('Not implemented.');
  };

  public readonly ResolveReferences = (context: Story): void => {
    super.ResolveReferences(context);
    context.CheckForNamingCollisions(this, this.name, SymbolType.ListItem);
  };
}