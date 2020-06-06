/**
 * This interface normalize the `TryGet` behavior found in the original
 * C# project. Any `TryGet` method will return a object conforming to this
 * interface.
 *
 * The original function returns a boolean and has a second parameter called
 * item that is an `out`. Both are needed and we can't just return the item
 * because it'll always be truthy. Instead, we return an object containing
 * whether the result exists (`exists`) and the result itself (`result`).
 *
 * For instance a `TryGet` prototype would look like this:
```
TryGetItemWithValue(val: number, item: InkListItem): TryGetResult<InkListItem>{
```
 *
 * On the other hand, dealing with the result can be done in the following way:
```
var item = item.TryGetItemWithValue(intVal, InkListItem.Null);
if (item.exists) {
	console.log(item.result)
}
```
 *
 */
export interface TryGetResult<T> {
  result: T;
  exists: boolean;
}

export function tryGetValueFromMap<K, V>(
  map: Map<K, V> | null,
  key: K,
  /* out */ value: V
): TryGetResult<V> {
  if (map === null) {
    return { result: value, exists: false };
  }

  let val = map.get(key);

  if (typeof val === "undefined") {
    return { result: value, exists: false };
  } else {
    return { result: val, exists: true };
  }
}

export function tryParseInt(
  value: any,
  /* out */ defaultValue: number = 0
): TryGetResult<number> {
  let val = parseInt(value);

  if (!Number.isNaN(val)) {
    return { result: val, exists: true };
  } else {
    return { result: defaultValue, exists: false };
  }
}

export function tryParseFloat(
  value: any,
  /* out */ defaultValue: number = 0
): TryGetResult<number> {
  let val = parseFloat(value);

  if (!Number.isNaN(val)) {
    return { result: val, exists: true };
  } else {
    return { result: defaultValue, exists: false };
  }
}
