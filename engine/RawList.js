class RawListItem{
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
		return new RawListItem(null, null);
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
		if (obj instanceof RawListItem) {
//			var otherItem = (RawListItem)obj;
			var otherItem = obj;
			return otherItem.itemName   == this.itemName 
				&& otherItem.originName == this.originName;
		}

		return false;
	}
	//GetHashCode not implemented
}

//in C#, rawlists are based on dictionnary; the equivalent of a dictionnary in js is Object, but we can't use that or it will conflate dictionnary items and RawList class properties.
//instead RawList-js has a special _values property wich contains the actual "Dictionnary", and a few Dictionnary methods are re-implemented on RawList. This also means directly iterating over the RawList won't work as expected. Maybe we can return a proxy if that's required.
class RawList{
	constructor(otherListOrSingleElement){
		this._values = {};
		this.origins = null;
		this._originNames = null;
		
		//polymorphioc constructor
		if (otherListOrSingleElement){
			if (otherListOrSingleElement instanceof RawList){
				var otherList = otherListOrSingleElement;
				this._values = Object.assign(this._values, otherList._values);
				this._originNames = otherList._originNames;
			}
			else if (otherListOrSingleElement.hasOwnProperty('Key') && otherListOrSingleElement.hasOwnProperty('Value')){
				var singleElement = otherListOrSingleElement;
				this.Add(singleElement.Key, singleElement.Value);
			}
		}
	}
	forEach(fn){
		for (var key in this._values){
			fn({
				Key: key,
				Value: this._values[key]
			});
		}
	}
	ContainsKey(key){
		return key in this._values[key];
	}
	Add(key, value){
		this._values[key] = value;
	}
	Remove(key){
		delete this._values[key];
	}
	get Count(){
		return Object.keys(this._values).length;
	}
	get originOfMaxItem(){
		if (this.origins == null) return null;

		var maxOriginName = this.maxItem.Key.originName;
		var result = null;
		this.origins.every(function(origin){
			if (origin.name == maxOriginName)
				result = origin;
				return false;
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

			this.forEach(function(itemAndValue){
				this._originNames.push(itemAndValue.Key.originName);
			});
		}

		return this._originNames;
	}
	SetInitialOriginName(initialOriginName){
		this._originNames = [initialOriginName];
	}
	SetInitialOriginNames(initialOriginNames){
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
		var list = new RawList();
		if (this.origins != null) {
			this.origins.forEach(function(origin){
				origin.items.forEach(function(itemAndValue){
					if (!this.ContainsKey(itemAndValue.Key))
						list.Add(itemAndValue.Key, itemAndValue.Value);
				});
			});
		}
		return list;
	}
	get all(){
		var list = new RawList();
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
		var union = new RawList(this);
		otherList.forEach(function(kv){
			union[kv.Key] = kv.Value;
		});
		return union;
	}
	Intersect(otherList){
		var intersection = new RawList();
		this.forEach(function(kv){
			if (otherList.ContainsKey(kv.Key))
				intersection.Add(kv.Key, kv.Value);
		});
		return intersection;
	}
	Without(listToRemove){
		var result = new RawList(this);
		listToRemove.forEach(function(kv){
			result.Remove(kv.Key);
		});
		return result;
	}
	Contains(otherList){
		var contains = true;
		otherList.forEach(function(kv){
			if (!this.ContainsKey(kv.Key)) forEach = false;
		});
		return forEach;
	}
	GreaterThan(otherList){
		if (this.Count == 0) return false;
		if (otherList.Count == 0) return true;

		// All greater
		return this.minItem.Value > otherList.maxItem.Value;
	}
	GreaterThanOrEquals(otherList){
		if (this.Count == 0) return false;
		if (this.otherList.Count == 0) return true;

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
			return new RawList(this.maxItem);
		else
			return new RawList();
	}
	MinAsList(){
		if (this.Count > 0)
			return new RawList(this.minItem);
		else
			return new RawList();
	}
	Equals(other){
//		var otherRawList = other as RawList;
		var otherRawList = other;
		if (otherRawList instanceof RawList === false) return false;
		if (otherRawList.Count != this.Count) return false;

		var equals = true;
		this.forEach(function(kv){
			if (!otherRawList.ContainsKey(kv.Key))
				equals = false;
		});

		return true;
	}
	//GetHashCode not implemented
	toString(){
		var ordered = [];
		this.forEach(function(kv){
			ordered.push(kv);
		});
		ordered.sort((x, y) => {
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
}