

export class ListDefinition{
	constructor(name, items){
		this._name = name || '';
		this._items = {};
		this._itemNameToValues = items || {};
	}
	get name(){
		return this._name;
	}
	get items(){
		if (this._items == null){
			this._items = {};
			for (var key in this._itemNameToValues){
				var item = new RawListItem(this.name, key);
				this._items[item] = this._itemNameToValues[key];
			}
		}
		return this._items;
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
	TryGetItemWithValue(val, item){//@CAREFUL: item is an out parameter and gets modified
		for (var key in this._itemNameToValues){
			if (this._itemNameToValues[key] == val) {
				item = new RawListItem(this.name, key);
				return true;
			}
		}

		item = RawListItem.Null;
		return false;
	}
	ListRange(min, max){
		var rawList = new RawList();
		for (var key in this._itemNameToValues){
			if (this._itemNameToValues[key] >= min && this._itemNameToValues[key] <= max) {
				var item = new RawListItem(this.name, key);
				rawList[item] = this._itemNameToValues[key];//@CAREFUL using item as a key?
			}
		}
		return new ListValue(rawList);
	}
}