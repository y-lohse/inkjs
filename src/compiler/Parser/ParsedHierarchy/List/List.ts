import { Container as RuntimeContainer } from '../../../../engine/Container';
import { Expression } from '../Expression/Expression';
import { InkList as RuntimeInkList } from '../../../../engine/InkList';
import { InkListItem as RuntimeInkListItem } from '../../../../engine/InkList';
import { ListElementDefinition } from './ListElementDefinition';
import { ListValue } from '../../../../engine/Value';

export class List extends Expression {
  constructor(public readonly itemNameList: string[]) {
    super();
  }

  public readonly GenerateIntoContainer = (
    container: RuntimeContainer,
  ): void => {
    const runtimeRawList = new RuntimeInkList();

    for (const itemName of this.itemNameList) {
      const nameParts = itemName.split('.');

      let listName: string = '';
      let listItemName: string = '';
      if (nameParts.length > 1) {
        listName = nameParts[0];
        listItemName = nameParts[1];
      } else {
        listItemName = nameParts[0];
      }

      const listItem = this.story.ResolveListItem(
        listName,
        listItemName,
        this,
      ) as ListElementDefinition;

      if (listItem === null) {
        if (listName === null) {
          this.Error(`Could not find list definition that contains item '${itemName}'`);
        } else {
          this.Error(`Could not find list item ${itemName}`);
        }
      } else {
        if( listItem.parent == null){
          this.Error(`Could not find list definition for item ${itemName}`);
          return;
        }
        if (listName === null) {
          listName = listItem.parent.name;
        }

        const item = new RuntimeInkListItem(listName, listItem.name);

        if (runtimeRawList.has(item.serialized())) {
          this.Warning(`Duplicate of item '${itemName}' in list.`);
        } else {
          runtimeRawList.Add(item, listItem.seriesValue);
        }
      }
    }

    container.AddContent(new ListValue( runtimeRawList ));
  };
}
