import {InkList, InkListItem, SerializedInkListItem} from './InkList';
import {ListValue} from './Value';
import {TryGetResult} from './TryGetResult';

export class ListDefinition{
	public _name: string;
	public _items: Map<SerializedInkListItem, number> | null;
	public _itemNameToValues: Map<string, number>;

	constructor(name: string, items: Map<string, number> | null){
		this._name = name || '';
		this._items = null;
		this._itemNameToValues = items || new Map();
	}
	get name(){
		return this._name;
	}
	get items(){
		if (this._items == null){
			this._items = new Map();
			for (const [key, value] of this._itemNameToValues){
				const item = new InkListItem(this.name, key);
				this._items.set(item.serialized(), value);
			}
		}

		return this._items;
	}

	public ValueForItem(item: InkListItem){
		if (!item.itemName) return 0;

		const intVal = this._itemNameToValues.get(item.itemName);
		if (typeof intVal !== 'undefined')
			return intVal;
		else
			return 0;
	}
	public ContainsItem(item: InkListItem){
		if (!item.itemName) return false;
		if (item.originName != this.name) return false;

		return this._itemNameToValues.has(item.itemName);
	}
	public ContainsItemWithName(itemName: string){
		return this._itemNameToValues.has(itemName);
	}
	public TryGetItemWithValue(val: number, /* out */ item: InkListItem): TryGetResult<InkListItem>{
		for (const [key, value] of this._itemNameToValues){
			if (value == val) {
				item = new InkListItem(this.name, key);
				return { result: item, exists: true };
			}
		}

		item = InkListItem.Null;
		return { result: item, exists: false };
	}
	public TryGetValueForItem(item: InkListItem, /* out */ intVal: number): TryGetResult<number>{
		if (!item.itemName) return { result: 0, exists: false };
		const value = this._itemNameToValues.get(item.itemName);

		if (!value) return { result: 0, exists: false };
		return { result: value, exists: true };
	}
	public ListRange(min: number, max: number){
		const rawList = new InkList();
		for (const [key, value] of this._itemNameToValues){
			if (value >= min && value <= max) {
				const item = new InkListItem(this.name, key);
				rawList.Add(item, value);
			}
		}
		return new ListValue(rawList);
	}
}
