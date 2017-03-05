import {RawList, RawListItem} from './RawList';
import {ListValue} from './Value';

export class ListDefinition{
	constructor(name, items){
		this._name = name || '';
		this._items = null;
		this._rawListItemsKeys = null;
		this._itemNameToValues = items || {};
	}
	get name(){
		return this._name;
	}
	get items(){
		if (this._items == null){
			this._items = {};
			this._rawListItemsKeys = {};
			for (var key in this._itemNameToValues){
				var item = new RawListItem(this.name, key);
				this._rawListItemsKeys[item] = item;
				this._items[item] = this._itemNameToValues[key];
			}
		}
		this._items.forEach = this.forEachItems.bind(this);
		
		return this._items;
	}
	forEachItems(fn){
		for (var key in this._rawListItemsKeys){
			fn({
				Key: this._rawListItemsKeys[key],
				Value: this._items[key]
			});
		}
	}
	ValueForItem(item){
		var intVal = this._itemNameToValues[item.itemName];
		if (intVal !== undefined)
			return intVal;
		else
			return 0;
	}
	ContainsItem(item){
		if (item.originName != this.name) return false;

		return (item.itemName in this._itemNameToValues);
	}
	TryGetItemWithValue(val, item){//item was an out
		//the original function returns a boolean and has a second parameter called item that is an `out`. Both are needed and we can't just return the item because it'll always be truthy. Instead, we return an object containing the bool an dthe item
		for (var key in this._itemNameToValues){
			if (this._itemNameToValues[key] == val) {
				item = new RawListItem(this.name, key);
				return {
					item :item,
					exists: true
				};
			}
		}

		item = RawListItem.Null;
		return {
			item :item,
			exists: false
		};
	}
	ListRange(min, max){
		var rawList = new RawList();
		for (var key in this._itemNameToValues){
			if (this._itemNameToValues[key] >= min && this._itemNameToValues[key] <= max) {
				var item = new RawListItem(this.name, key);
				rawList.Add(item, this._itemNameToValues[key]);
			}
		}
		return new ListValue(rawList);
	}
}