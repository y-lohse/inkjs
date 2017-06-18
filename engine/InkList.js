import {StringBuilder} from './StringBuilder';

export class InkListItem{
	constructor(fullNameOrOriginName, itemName){
		if (itemName !== undefined){
			this.originName = fullNameOrOriginName;
			this.itemName = itemName;
		}
		else{
			var nameParts = fullNameOrOriginName.toString().split('.');
            this.originName = nameParts[0];
            this.itemName = nameParts[1];
		}
	}
	static Null(){
		return new InkListItem(null, null);
	}
	isNull(){
		return this.originName == null && this.itemName == null;
	}
	get fullName(){
		return ((this.originName !== null) ? this.originName : "?") + "." + this.itemName;
	}
	toString(){
		return this.fullname;
	}
	Equals(obj){
		if (obj instanceof InkListItem) {
//			var otherItem = (InkListItem)obj;
			var otherItem = obj;
			return otherItem.itemName   == this.itemName 
				&& otherItem.originName == this.originName;
		}

		return false;
	}
	//GetHashCode not implemented
	toString(){
		//WARNING: experimental. InkListItem are structs and are used as keys inside hashes. In js, we can't use an object as a key, as the key needs to be a string. C# gets around that with the internal GetHashCode, and the js equivalent to that is toString. So here, toString acts as C#'s GetHashCode
		var originCode = '0';
		var itemCode = (this.itemName) ? this.itemName.toString() : 'null';
		if (this.originName != null)
			originCode = this.originName.toString();
		
		return originCode + itemCode;
	}
}

//in C#, rawlists are based on dictionnary; the equivalent of a dictionnary in js is Object, but we can't use that or it will conflate dictionnary items and InkList class properties.
//instead InkList-js has a special _values property wich contains the actual "Dictionnary", and a few Dictionnary methods are re-implemented on InkList. This also means directly iterating over the InkList won't work as expected. Maybe we can return a proxy if that's required.
//@TODO: actually we could use a Map for this.
export class InkList {
	constructor(polymorphicArgument, originStory){
		this._keys = {};
		this._values = {};
		this.origins = null;
		this._originNames = null;
		
		//polymorphioc constructor
		if (polymorphicArgument){
			if (polymorphicArgument instanceof InkList){
				var otherList = polymorphicArgument;
				otherList.forEach((kv)=>{
					this.Add(kv.Key, kv.Value);
				});
				
				this._originNames = otherList._originNames;
			}
			else if (typeof polymorphicArgument === 'string'){
				this.SetInitialOriginName(polymorphicArgument);
				
				var def = null;
				if (def = originStory.listDefinitions.TryGetDefinition(polymorphicArgument, def)){
					this.origins = [def];
				}
				else{
					throw new Error("InkList origin could not be found in story when constructing new list: " + singleOriginListName);
				}
			}
			else if (polymorphicArgument.hasOwnProperty('Key') && polymorphicArgument.hasOwnProperty('Value')){
				var singleElement = polymorphicArgument;
				this.Add(singleElement.Key, singleElement.Value);
			}
		}
	}
	forEach(fn){
		for (var key in this._values){
			fn({
				Key: this._keys[key],
				Value: this._values[key]
			});
		}
	}
	AddItem(itemOrItemName){
		if (itemOrItemName instanceof InkListItem){
			var item = itemOrItemName;
			
			if (item.originName == null) {
					this.AddItem(item.itemName);
					return;
			}

			this.origins.forEach((origin)=>{
				if (origin.name == item.originName) {
						var intVal;
						intVal = origin.TryGetValueForItem(item, intVal);
						if (intVal !== undefined) {
								this.Add(item, intVal);
								return;
						} else {
								throw "Could not add the item " + item + " to this list because it doesn't exist in the original list definition in ink.";
						}
				}
			});

			throw "Failed to add item to list because the item was from a new list definition that wasn't previously known to this list. Only items from previously known lists can be used, so that the int value can be found.";
		}
		else{
			var itemName = itemOrItemName;
			
			var foundListDef = null;

			this.origins.forEach((origin)=>{
				if (origin.ContainsItemWithName(itemName)) {
						if (foundListDef != null) {
								throw "Could not add the item " + itemName + " to this list because it could come from either " + origin.name + " or " + foundListDef.name;
						} else {
								foundListDef = origin;
						}
				}
			});

			if (foundListDef == null)
					throw "Could not add the item " + itemName + " to this list because it isn't known to any list definitions previously associated with this list.";

			var item = new InkListItem(foundListDef.name, itemName);
			var itemVal = foundListDef.ValueForItem(item);
			this.Add(item, itemVal);
		}
	}
	ContainsItemNamed(itemName){
		var contains = false;
		this.forEach(itemWithValue => {
				if (itemWithValue.Key.itemName == itemName) contains = true;
		});
		return contains;
	}
	ContainsKey(key){
		return key in this._values;
	}
	Add(key, value){
		this._keys[key] = key;
		this._values[key] = value;
	}
	Remove(key){
		delete this._values[key];
		delete this._keys[key];
	}
	get Count(){
		return Object.keys(this._values).length;
	}
	get originOfMaxItem(){
		if (this.origins == null) return null;

		var maxOriginName = this.maxItem.Key.originName;
		var result = null;
		this.origins.every(function(origin){
			if (origin.name == maxOriginName){
				result = origin;
				return false;
			}
			else return true;
		});
		
		return result;
	}
	get originNames(){
		if (this.Count > 0) {
			if (this._originNames == null && this.Count > 0)
				this._originNames = [];
			else
				this._originNames.length = 0;

			this.forEach((itemAndValue)=>{
				this._originNames.push(itemAndValue.Key.originName);
			});
		}

		return this._originNames;
	}
	SetInitialOriginName(initialOriginName){
		this._originNames = [initialOriginName];
	}
	SetInitialOriginNames(initialOriginNames){
		if (initialOriginNames == null)
				this._originNames = null;
		else
				this._originNames = initialOriginNames.slice();//store a copy
	}
	get maxItem(){
		var max = {
			Key: null,
			Value: null
		};
		this.forEach(function(kv){
			if (max.Key === null || kv.Value > max.Value)
				max = kv;
		});
		
		return max;
	}
	get minItem(){
		var min = {
			Key: null,
			Value: null
		};
		this.forEach(function(kv){
			if (min.Key === null || kv.Value < min.Value)
				min = kv;
		});
		
		return min;
	}
	get inverse(){
		var list = new InkList();
		if (this.origins != null) {
			this.origins.forEach((origin)=>{
				origin.items.forEach((itemAndValue)=>{
					if (!this.ContainsKey(itemAndValue.Key))
						list.Add(itemAndValue.Key, itemAndValue.Value);
				});
			});
		}
		return list;
	}
	get all(){
		var list = new InkList();
		if (this.origins != null) {
			this.origins.forEach(function(origin){
				origin.items.forEach(function(itemAndValue){
					list.Add(itemAndValue.Key, itemAndValue.Value);
				});
			});
		}
		return list;
	}
	Union(otherList){
		var union = new InkList(this);
		otherList.forEach(function(kv){
			union.Add(kv.Key, kv.Value);
		});
		return union;
	}
	Intersect(otherList){
		var intersection = new InkList();
		this.forEach(function(kv){
			if (otherList.ContainsKey(kv.Key))
				intersection.Add(kv.Key, kv.Value);
		});
		return intersection;
	}
	Without(listToRemove){
		var result = new InkList(this);
		listToRemove.forEach(function(kv){
			result.Remove(kv.Key);
		});
		return result;
	}
	Contains(otherList){
		var contains = true;
		otherList.forEach((kv)=>{
			if (!this.ContainsKey(kv.Key)) contains = false;
		});
		return contains;
	}
	GreaterThan(otherList){
		if (this.Count == 0) return false;
		if (otherList.Count == 0) return true;

		// All greater
		return this.minItem.Value > otherList.maxItem.Value;
	}
	GreaterThanOrEquals(otherList){
		if (this.Count == 0) return false;
		if (otherList.Count == 0) return true;

		return this.minItem.Value >= otherList.minItem.Value
			&& this.maxItem.Value >= otherList.maxItem.Value;
	}
	LessThan(otherList){
		if (otherList.Count == 0) return false;
		if (this.Count == 0) return true;

		return this.maxItem.Value < otherList.minItem.Value;
	}
	LessThanOrEquals(otherList){
		if (otherList.Count == 0) return false;
		if (this.Count == 0) return true;

		return this.maxItem.Value <= otherList.maxItem.Value
			&& this.minItem.Value <= otherList.minItem.Value;
	}
	MaxAsList(){
		if (this.Count > 0)
			return new InkList(this.maxItem);
		else
			return new InkList();
	}
	MinAsList(){
		if (this.Count > 0)
			return new InkList(this.minItem);
		else
			return new InkList();
	}
	Equals(other){
//		var otherInkList = other as InkList;
		var otherInkList = other;
		if (otherInkList instanceof InkList === false) return false;
		if (otherInkList.Count != this.Count) return false;

		var equals = true;
		this.forEach(function(kv){
			if (!otherInkList.ContainsKey(kv.Key))
				equals = false;
		});

		return equals;
	}
	//GetHashCode not implemented
	toString(){
		var ordered = [];
		this.forEach(function(kv){
			ordered.push(kv);
		});
		ordered = ordered.sort((a, b) => {
			return (a.Value === b.Value) ? 0 : ((a.Value > b.Value) ? 1 : -1);
		});

		var sb = new StringBuilder();
		for (var i = 0; i < ordered.length; i++) {
			if (i > 0)
				sb.Append(", ");

			var item = ordered[i].Key;
			sb.Append(item.itemName);
		}

		return sb.toString();
	}
	//casting a InkList to a Number, for somereason, actually gives a number. This messes up the type detection when creating a Value from a InkList. Returning NaN here prevents that.
	valueOf(){
		return NaN;
	}
}
