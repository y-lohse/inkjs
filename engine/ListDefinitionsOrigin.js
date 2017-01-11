export class ListDefinitionsOrigin{
	constructor(lists){
		this._lists = {};
		
		lists.forEach(function(list){
			this._lists[list.name] = list;
		});
	}
	get lists(){
		var listOfLists = [];
		
		for (var key in this._lists){
			listOfLists.push(this._lists[key]);
		}
		return listOfLists;
	}
	TryGetDefinition(name, def){
		//initially, this function returns a boolean and the second parameter is an out.
		return (name in this._lists) ? this._lists[name] : def;
	}
	FindSingleItemListWithName(name){
		var item = RawListItem.Null;
		var list = null;

		var nameParts = name.split('.');
		if (nameParts.length == 2) {
			item = new RawListItem(nameParts[0], nameParts[1]);
			list = this.TryGetDefinition(item.originName, list);
		} else {
			for (var key in this._lists){
				var listWithItem = this._lists[key];
				item = new RawListItem(key, name);
				if (listWithItem.ContainsItem(item)) {
					list = listWithItem;
					break;
				}
			}
		}
		
		if (list != null) {
			var itemValue = list.ValueForItem(item);
			return new ListValue(item, itemValue);
		}

		return null;
	}
}