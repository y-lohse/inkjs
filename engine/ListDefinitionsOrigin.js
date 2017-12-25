import {InkListItem} from './InkList';
import {ListValue} from './Value';

export class ListDefinitionsOrigin{
	constructor(lists){
		this._lists = {};
    this._allUnambiguousListValueCache = {};
		
		lists.forEach((list)=>{
			this._lists[list.name] = list;
      
      list.items.forEach(itemWithValue => {
        var item = itemWithValue.Key;
        var val = itemWithValue.Value;
        var listValue = new ListValue(item, val);
        
        this._allUnambiguousListValueCache[item.itemName] = listValue;
        this._allUnambiguousListValueCache[item.fullName] = listValue;
      });
		});
	}
	get lists(){
		var listOfLists = [];
		
		for (var key in this._lists){
			listOfLists.push(this._lists[key]);
		}
		return listOfLists;
	}
	TryListGetDefinition(name, def){
		//initially, this function returns a boolean and the second parameter is an out.
		return (name in this._lists) ? this._lists[name] : def;
	}
	FindSingleItemListWithName(name){
		var val = null;
    if (typeof this._allUnambiguousListValueCache[name] !== 'undefined') val = this._allUnambiguousListValueCache[name];
    return val;
	}
}