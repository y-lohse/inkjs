import { Container as RuntimeContainer } from "../../../../engine/Container";
import { Expression } from "../Expression/Expression";
import { InkList as RuntimeInkList } from "../../../../engine/InkList";
import { InkListItem as RuntimeInkListItem } from "../../../../engine/InkList";
import { ListElementDefinition } from "./ListElementDefinition";
import { ListValue } from "../../../../engine/Value";
import { Identifier } from "../Identifier";

export class List extends Expression {
  constructor(public readonly itemIdentifierList: Identifier[]) {
    super();
  }

  get typeName(): string {
    return "List";
  }

  public readonly GenerateIntoContainer = (
    container: RuntimeContainer
  ): void => {
    const runtimeRawList = new RuntimeInkList();

    if (this.itemIdentifierList != null) {
      for (const itemIdentifier of this.itemIdentifierList) {
        const nameParts = itemIdentifier?.name?.split(".") || [];

        let listName: string | null = null;
        let listItemName: string = "";
        if (nameParts.length > 1) {
          listName = nameParts[0];
          listItemName = nameParts[1];
        } else {
          listItemName = nameParts[0];
        }

        const listItem = this.story.ResolveListItem(
          listName,
          listItemName,
          this
        ) as ListElementDefinition;

        if (listItem === null) {
          if (listName === null) {
            this.Error(
              `Could not find list definition that contains item '${itemIdentifier}'`
            );
          } else {
            this.Error(`Could not find list item ${itemIdentifier}`);
          }
        } else {
          if (listItem.parent == null) {
            this.Error(
              `Could not find list definition for item ${itemIdentifier}`
            );
            return;
          }
          if (!listName) {
            listName = listItem.parent.identifier?.name || null;
          }

          const item = new RuntimeInkListItem(listName, listItem.name || null);

          if (runtimeRawList.has(item.serialized())) {
            this.Warning(`Duplicate of item '${itemIdentifier}' in list.`);
          } else {
            runtimeRawList.Add(item, listItem.seriesValue);
          }
        }
      }
    }

    container.AddContent(new ListValue(runtimeRawList));
  };
}
