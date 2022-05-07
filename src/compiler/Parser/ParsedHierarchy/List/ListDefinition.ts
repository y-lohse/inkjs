import { InkList as RuntimeInkList } from "../../../../engine/InkList";
import { InkListItem as RuntimeInkListItem } from "../../../../engine/InkList";
import { ListDefinition as RuntimeListDefinition } from "../../../../engine/ListDefinition";
import { ListElementDefinition } from "./ListElementDefinition";
import { ListValue } from "../../../../engine/Value";
import { ParsedObject } from "../Object";
import { Story } from "../Story";
import { SymbolType } from "../SymbolType";
import { VariableAssignment } from "../Variable/VariableAssignment";
import { Identifier } from "../Identifier";

export class ListDefinition extends ParsedObject {
  public identifier: Identifier | null = null;
  public variableAssignment: VariableAssignment | null = null;

  get typeName() {
    return "ListDefinition";
  }

  private _elementsByName: Map<string, ListElementDefinition> | null = null;

  get runtimeListDefinition(): RuntimeListDefinition {
    const allItems: Map<string, number> = new Map();
    for (const e of this.itemDefinitions) {
      if (!allItems.has(e.name!)) {
        allItems.set(e.name!, e.seriesValue);
      } else {
        this.Error(
          `List '${this.identifier}' contains duplicate items called '${e.name}'`
        );
      }
    }

    return new RuntimeListDefinition(this.identifier?.name || "", allItems);
  }

  public readonly ItemNamed = (
    itemName: string
  ): ListElementDefinition | null => {
    if (this._elementsByName === null) {
      this._elementsByName = new Map();

      for (const el of this.itemDefinitions) {
        this._elementsByName.set(el.name!, el);
      }
    }

    const foundElement = this._elementsByName.get(itemName) || null;

    return foundElement;
  };

  constructor(public itemDefinitions: ListElementDefinition[]) {
    super();

    let currentValue = 1;
    for (const e of this.itemDefinitions) {
      if (e.explicitValue !== null) {
        currentValue = e.explicitValue;
      }

      e.seriesValue = currentValue;

      currentValue += 1;
    }

    this.AddContent(itemDefinitions as any);
  }

  public readonly GenerateRuntimeObject = (): ListValue => {
    const initialValues = new RuntimeInkList();
    for (const itemDef of this.itemDefinitions) {
      if (itemDef.inInitialList) {
        const item = new RuntimeInkListItem(
          this.identifier?.name || null,
          itemDef.name || null
        );
        initialValues.Add(item, itemDef.seriesValue);
      }
    }

    // Set origin name, so
    initialValues.SetInitialOriginName(this.identifier?.name || "");

    return new ListValue(initialValues);
  };

  public ResolveReferences(context: Story): void {
    super.ResolveReferences(context);
    context.CheckForNamingCollisions(this, this.identifier!, SymbolType.List);
  }
}
