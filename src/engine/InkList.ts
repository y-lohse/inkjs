import { throwNullException } from "./NullException";
import { StringBuilder } from "./StringBuilder";
import { ListDefinition } from "./ListDefinition";
import { Story } from "./Story";

export class InkListItem implements IInkListItem {
  // InkListItem is a struct

  public readonly originName: string | null = null;
  public readonly itemName: string | null = null;

  constructor(originName: string | null, itemName: string | null);
  constructor(fullName: string | null);
  constructor() {
    if (typeof arguments[1] !== "undefined") {
      let originName = arguments[0] as string | null;
      let itemName = arguments[1] as string | null;

      this.originName = originName;
      this.itemName = itemName;
    } else if (arguments[0]) {
      let fullName = arguments[0] as string;

      let nameParts = fullName.toString().split(".");
      this.originName = nameParts[0];
      this.itemName = nameParts[1];
    }
  }
  public static get Null() {
    return new InkListItem(null, null);
  }
  public get isNull() {
    return this.originName == null && this.itemName == null;
  }
  get fullName() {
    return (
      (this.originName !== null ? this.originName : "?") + "." + this.itemName
    );
  }
  public toString(): string {
    return this.fullName;
  }
  public Equals(obj: InkListItem) {
    if (obj instanceof InkListItem) {
      let otherItem = obj;
      return (
        otherItem.itemName == this.itemName &&
        otherItem.originName == this.originName
      );
    }

    return false;
  }

  // These methods did not exist in the original C# code. Their purpose is to
  // make `InkListItem` mimics the value-type semantics of the original
  // struct. Please refer to the end of this file, for a more in-depth
  // explanation.

  /**
   * Returns a shallow clone of the current instance.
   */
  public copy() {
    return new InkListItem(this.originName, this.itemName);
  }
  /**
   * Returns a `SerializedInkListItem` representing the current
   * instance. The result is intended to be used as a key inside a Map.
   */
  public serialized(): SerializedInkListItem {
    // We are simply using a JSON representation as a value-typed key.
    return JSON.stringify({
      originName: this.originName,
      itemName: this.itemName,
    });
  }

  /**
   * Reconstructs a `InkListItem` from the given SerializedInkListItem.
   */
  public static fromSerializedKey(key: SerializedInkListItem): InkListItem {
    let obj = JSON.parse(key);
    if (!InkListItem.isLikeInkListItem(obj)) return InkListItem.Null;

    let inkListItem = obj as IInkListItem;

    return new InkListItem(inkListItem.originName, inkListItem.itemName);
  }

  /**
   * Determines whether the given item is sufficiently `InkListItem`-like
   * to be used as a template when reconstructing the InkListItem.
   */
  private static isLikeInkListItem(item: any) {
    if (typeof item !== "object") return false;
    if (!item.hasOwnProperty("originName") || !item.hasOwnProperty("itemName"))
      return false;
    if (typeof item.originName !== "string" && typeof item.originName !== null)
      return false;
    if (typeof item.itemName !== "string" && typeof item.itemName !== null)
      return false;

    return true;
  }
}

export class InkList extends Map<SerializedInkListItem, number> {
  public origins: ListDefinition[] | null = null;
  public _originNames: string[] | null = [];

  constructor();
  constructor(otherList: InkList);
  constructor(singleOriginListName: string, originStory: Story);
  constructor(singleElement: KeyValuePair<InkListItem, number>);
  constructor() {
    // Trying to be smart here, this emulates the constructor inheritance found
    // in the original code, but only if otherList is an InkList. IIFE FTW.
    super(
      (() => {
        if (arguments[0] instanceof InkList) {
          return arguments[0];
        } else {
          return [];
        }
      })()
    );

    if (arguments[0] instanceof InkList) {
      let otherList = arguments[0] as InkList;

      let otherOriginNames = otherList.originNames as string[];
      if (otherOriginNames !== null)
        this._originNames = otherOriginNames.slice();
      if (otherList.origins !== null) {
        this.origins = otherList.origins.slice();
      }
    } else if (typeof arguments[0] === "string") {
      let singleOriginListName = arguments[0] as string;
      let originStory = arguments[1] as Story;
      this.SetInitialOriginName(singleOriginListName);

      if (originStory.listDefinitions === null) {
        return throwNullException("originStory.listDefinitions");
      }
      let def = originStory.listDefinitions.TryListGetDefinition(
        singleOriginListName,
        null
      );
      if (def.exists) {
        // Throwing now, because if the value is `null` it will
        // eventually throw down the line.
        if (def.result === null) {
          return throwNullException("def.result");
        }
        this.origins = [def.result];
      } else {
        throw new Error(
          "InkList origin could not be found in story when constructing new list: " +
            singleOriginListName
        );
      }
    } else if (
      typeof arguments[0] === "object" &&
      arguments[0].hasOwnProperty("Key") &&
      arguments[0].hasOwnProperty("Value")
    ) {
      let singleElement = arguments[0] as KeyValuePair<InkListItem, number>;
      this.Add(singleElement.Key, singleElement.Value);
    }
  }

  public static FromString(myListItem: string, originStory: Story) {
    if (myListItem == null || myListItem == "") return new InkList();
    let listValue =
      originStory.listDefinitions?.FindSingleItemListWithName(myListItem);
    if (listValue) {
      if (listValue.value === null) {
        return throwNullException("listValue.value");
      }
      return new InkList(listValue.value);
    } else {
      throw new Error(
        "Could not find the InkListItem from the string '" +
          myListItem +
          "' to create an InkList because it doesn't exist in the original list definition in ink."
      );
    }
  }

  public AddItem(
    itemOrItemName: InkListItem | string | null,
    storyObject: Story | null = null
  ) {
    if (itemOrItemName instanceof InkListItem) {
      let item = itemOrItemName;

      if (item.originName == null) {
        this.AddItem(item.itemName);
        return;
      }

      if (this.origins === null) return throwNullException("this.origins");

      for (let origin of this.origins) {
        if (origin.name == item.originName) {
          let intVal = origin.TryGetValueForItem(item, 0);
          if (intVal.exists) {
            this.Add(item, intVal.result);
            return;
          } else {
            throw new Error(
              "Could not add the item " +
                item +
                " to this list because it doesn't exist in the original list definition in ink."
            );
          }
        }
      }

      throw new Error(
        "Failed to add item to list because the item was from a new list definition that wasn't previously known to this list. Only items from previously known lists can be used, so that the int value can be found."
      );
    } else if (itemOrItemName !== null) {
      //itemOrItemName is a string
      let itemName = itemOrItemName as string;

      let foundListDef: ListDefinition | null = null;

      if (this.origins === null) return throwNullException("this.origins");

      for (let origin of this.origins) {
        if (itemName === null) return throwNullException("itemName");

        if (origin.ContainsItemWithName(itemName)) {
          if (foundListDef != null) {
            throw new Error(
              "Could not add the item " +
                itemName +
                " to this list because it could come from either " +
                origin.name +
                " or " +
                foundListDef.name
            );
          } else {
            foundListDef = origin;
          }
        }
      }

      if (foundListDef == null) {
        if (storyObject == null) {
          throw new Error(
            "Could not add the item " +
              itemName +
              " to this list because it isn't known to any list definitions previously associated with this list."
          );
        } else {
          let newItem = InkList.FromString(itemName, storyObject)
            .orderedItems[0];
          this.Add(newItem.Key, newItem.Value);
        }
      } else {
        let item = new InkListItem(foundListDef.name, itemName);
        let itemVal = foundListDef.ValueForItem(item);
        this.Add(item, itemVal);
      }
    }
  }
  public ContainsItemNamed(itemName: string | null) {
    for (let [key] of this) {
      let item = InkListItem.fromSerializedKey(key);
      if (item.itemName == itemName) return true;
    }

    return false;
  }
  public ContainsKey(key: InkListItem) {
    return this.has(key.serialized());
  }
  public Add(key: InkListItem, value: number) {
    let serializedKey = key.serialized();
    if (this.has(serializedKey)) {
      // Throw an exception to match the C# behavior.
      throw new Error(`The Map already contains an entry for ${key}`);
    }
    this.set(serializedKey, value);
  }
  public Remove(key: InkListItem) {
    return this.delete(key.serialized());
  }
  get Count() {
    return this.size;
  }
  get originOfMaxItem(): ListDefinition | null {
    if (this.origins == null) return null;

    let maxOriginName = this.maxItem.Key.originName;
    let result = null;
    this.origins.every((origin) => {
      if (origin.name == maxOriginName) {
        result = origin;
        return false;
      } else return true;
    });

    return result;
  }
  get originNames(): string[] {
    if (this.Count > 0) {
      if (this._originNames == null && this.Count > 0) this._originNames = [];
      else {
        if (!this._originNames) this._originNames = [];
        this._originNames.length = 0;
      }

      for (let [key] of this) {
        let item = InkListItem.fromSerializedKey(key);
        if (item.originName === null)
          return throwNullException("item.originName");
        this._originNames.push(item.originName);
      }
    }

    return this._originNames as string[];
  }
  public SetInitialOriginName(initialOriginName: string) {
    this._originNames = [initialOriginName];
  }
  public SetInitialOriginNames(initialOriginNames: string[]) {
    if (initialOriginNames == null) this._originNames = null;
    else this._originNames = initialOriginNames.slice(); // store a copy
  }
  get maxItem() {
    let max: KeyValuePair<InkListItem, number> = {
      Key: InkListItem.Null,
      Value: 0,
    };
    for (let [key, value] of this) {
      let item = InkListItem.fromSerializedKey(key);
      if (max.Key.isNull || value > max.Value)
        max = { Key: item, Value: value };
    }

    return max;
  }
  get minItem() {
    let min: KeyValuePair<InkListItem, number> = {
      Key: InkListItem.Null,
      Value: 0,
    };
    for (let [key, value] of this) {
      let item = InkListItem.fromSerializedKey(key);
      if (min.Key.isNull || value < min.Value) {
        min = { Key: item, Value: value };
      }
    }
    return min;
  }
  get inverse() {
    let list = new InkList();
    if (this.origins != null) {
      for (let origin of this.origins) {
        for (let [key, value] of origin.items) {
          let item = InkListItem.fromSerializedKey(key);
          if (!this.ContainsKey(item)) list.Add(item, value);
        }
      }
    }
    return list;
  }
  get all() {
    let list = new InkList();
    if (this.origins != null) {
      for (let origin of this.origins) {
        for (let [key, value] of origin.items) {
          let item = InkListItem.fromSerializedKey(key);
          list.set(item.serialized(), value);
        }
      }
    }
    return list;
  }
  public Union(otherList: InkList) {
    let union = new InkList(this);
    for (let [key, value] of otherList) {
      union.set(key, value);
    }
    return union;
  }
  public Intersect(otherList: InkList) {
    let intersection = new InkList();
    for (let [key, value] of this) {
      if (otherList.has(key)) intersection.set(key, value);
    }

    return intersection;
  }
  public HasIntersection(otherList: InkList): boolean {
    for (let [key] of this) {
      if (otherList.has(key)) return true;
    }
    return false;
  }
  public Without(listToRemove: InkList) {
    let result = new InkList(this);
    for (let [key] of listToRemove) {
      result.delete(key);
    }

    return result;
  }

  public Contains(key: string): boolean;
  public Contains(otherList: InkList): boolean;
  public Contains(what: string | InkList): boolean {
    if (typeof what == "string") return this.ContainsItemNamed(what);
    const otherList = what;
    if (otherList.size == 0 || this.size == 0) return false;
    for (let [key] of otherList) {
      if (!this.has(key)) return false;
    }

    return true;
  }
  public GreaterThan(otherList: InkList) {
    if (this.Count == 0) return false;
    if (otherList.Count == 0) return true;

    return this.minItem.Value > otherList.maxItem.Value;
  }
  public GreaterThanOrEquals(otherList: InkList) {
    if (this.Count == 0) return false;
    if (otherList.Count == 0) return true;

    return (
      this.minItem.Value >= otherList.minItem.Value &&
      this.maxItem.Value >= otherList.maxItem.Value
    );
  }
  public LessThan(otherList: InkList) {
    if (otherList.Count == 0) return false;
    if (this.Count == 0) return true;

    return this.maxItem.Value < otherList.minItem.Value;
  }
  public LessThanOrEquals(otherList: InkList) {
    if (otherList.Count == 0) return false;
    if (this.Count == 0) return true;

    return (
      this.maxItem.Value <= otherList.maxItem.Value &&
      this.minItem.Value <= otherList.minItem.Value
    );
  }
  public MaxAsList() {
    if (this.Count > 0) return new InkList(this.maxItem);
    else return new InkList();
  }
  public MinAsList() {
    if (this.Count > 0) return new InkList(this.minItem);
    else return new InkList();
  }
  public ListWithSubRange(minBound: any, maxBound: any) {
    if (this.Count == 0) return new InkList();

    let ordered = this.orderedItems;

    let minValue = 0;
    let maxValue = Number.MAX_SAFE_INTEGER;

    if (Number.isInteger(minBound)) {
      minValue = minBound;
    } else {
      if (minBound instanceof InkList && minBound.Count > 0)
        minValue = minBound.minItem.Value;
    }

    if (Number.isInteger(maxBound)) {
      maxValue = maxBound;
    } else {
      if (maxBound instanceof InkList && maxBound.Count > 0)
        maxValue = maxBound.maxItem.Value;
    }

    let subList = new InkList();
    subList.SetInitialOriginNames(this.originNames);
    for (let item of ordered) {
      if (item.Value >= minValue && item.Value <= maxValue) {
        subList.Add(item.Key, item.Value);
      }
    }

    return subList;
  }
  public Equals(otherInkList: InkList) {
    if (otherInkList instanceof InkList === false) return false;
    if (otherInkList.Count != this.Count) return false;

    for (let [key] of this) {
      if (!otherInkList.has(key)) return false;
    }

    return true;
  }
  // GetHashCode not implemented
  get orderedItems() {
    // List<KeyValuePair<InkListItem, int>>
    let ordered = new Array<KeyValuePair<InkListItem, number>>();

    for (let [key, value] of this) {
      let item = InkListItem.fromSerializedKey(key);
      ordered.push({ Key: item, Value: value });
    }

    ordered.sort((x, y) => {
      if (x.Key.originName === null) {
        return throwNullException("x.Key.originName");
      }
      if (y.Key.originName === null) {
        return throwNullException("y.Key.originName");
      }

      if (x.Value == y.Value) {
        return x.Key.originName.localeCompare(y.Key.originName);
      } else {
        // TODO: refactor this bit into a numberCompareTo method?
        if (x.Value < y.Value) return -1;
        return x.Value > y.Value ? 1 : 0;
      }
    });

    return ordered;
  }

  get singleItem(): InkListItem | null {
    for (let item of this.orderedItems) {
      return item.Key;
    }
    return null;
  }

  public toString() {
    let ordered = this.orderedItems;

    let sb = new StringBuilder();
    for (let i = 0; i < ordered.length; i++) {
      if (i > 0) sb.Append(", ");

      let item = ordered[i].Key;
      if (item.itemName === null) return throwNullException("item.itemName");
      sb.Append(item.itemName);
    }

    return sb.toString();
  }
  // casting a InkList to a Number, for somereason, actually gives a number.
  // This messes up the type detection when creating a Value from a InkList.
  // Returning NaN here prevents that.
  public valueOf() {
    return NaN;
  }
}

/**
 * In the original C# code, `InkListItem` was defined as value type, meaning
 * that two `InkListItem` would be considered equal as long as they held the
 * same values. This doesn't hold true in Javascript, as `InkListItem` is a
 * reference type (Javascript doesn't allow the creation of custom value types).
 *
 * The key equality of Map objects is based on the "SameValueZero" algorithm;
 * since `InkListItem` is a value type, two keys will only be considered
 * equal if they are, in fact, the same object. As we are trying to emulate
 * the original behavior as close as possible, this will lead to unforeseen
 * side effects.
 *
 * In order to have a key equality based on value semantics, we'll convert
 * `InkListItem` to a valid string representation and use this representation
 * as a key (strings are value types in Javascript). Rather than using the
 * type `string` directly, we'll alias it to `SerializedInkListItem` and use
 * this type as the key for our Map-based `InkList`.
 *
 * Reducing `InkListItem` to a JSON representation would not be bulletproof
 * in the general case, but for our needs it works well. The major downside of
 * this method is that we will have to to reconstruct the original `InkListItem`
 * every time we'll need to access its properties.
 */
export type SerializedInkListItem = string;

/**
 * An interface inherited by `InkListItem`, defining exposed
 * properties. It's mainly used when deserializing a `InkListItem` from its
 * key (`SerializedInkListItem`)
 */
interface IInkListItem {
  readonly originName: string | null;
  readonly itemName: string | null;
}
export interface KeyValuePair<K, V> {
  Key: K;
  Value: V;
}
