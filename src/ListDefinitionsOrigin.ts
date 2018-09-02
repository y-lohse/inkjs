import {InkListItem} from './InkList';
import {ListValue} from './Value';
import {ListDefinition} from './ListDefinition';
import {TryGetResult} from './TryGetResult';
import {throwNullException} from './NullException';

export class ListDefinitionsOrigin{
	protected _lists: Map<string, ListDefinition>;
	protected _allUnambiguousListValueCache: Map<string, ListValue>;

	constructor(lists: ListDefinition[]){
		this._lists = new Map();
		this._allUnambiguousListValueCache = new Map();

		for (const list of lists){
			this._lists.set(list.name, list);

			for (const [key, val] of list.items){
				const item = InkListItem.fromSerializedKey(key);
				const listValue = new ListValue(item, val);

				if (!item.itemName) { throw new Error('item.itemName is null or undefined.'); }

				this._allUnambiguousListValueCache.set(item.itemName, listValue);
				this._allUnambiguousListValueCache.set(item.fullName, listValue);
			}
		}
	}
	get lists(): ListDefinition[]{
		const listOfLists: ListDefinition[] = [];

		for (const [key, value] of this._lists){
			listOfLists.push(value);
		}

		return listOfLists;
	}
	public TryListGetDefinition(name: string, /* out */ def: ListDefinition): TryGetResult<ListDefinition>{
		// initially, this function returns a boolean and the second parameter is an out.
		const definition = this._lists.get(name);
		if (!definition) return { result: def, exists: false };

		return { result: definition, exists: true };
	}
	public FindSingleItemListWithName(name: string | null){
		if (name === null) { return throwNullException('name'); }
		const val = this._allUnambiguousListValueCache.get(name);

		if (typeof val !== 'undefined'){
			return val;
		}

		return null;
	}
}
