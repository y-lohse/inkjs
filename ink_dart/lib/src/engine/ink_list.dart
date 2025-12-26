/// InkList implementation - Ink's enumeration/flag system.
///
/// InkLists are ordered sets of named items from list definitions,
/// supporting set operations like union, intersection, and contains.

import 'list_definition.dart';

/// Represents a single item in an InkList.
///
/// Each item has an origin (the list it came from) and a name.
class InkListItem {
  final String? originName;
  final String? itemName;

  /// Create an item with origin and name.
  const InkListItem(this.originName, this.itemName);

  /// Create an item from a full name like "ListName.ItemName".
  factory InkListItem.fromFullName(String fullName) {
    final parts = fullName.split('.');
    if (parts.length >= 2) {
      return InkListItem(parts[0], parts[1]);
    }
    return InkListItem(null, fullName);
  }

  /// The null item singleton.
  static const InkListItem nullItem = InkListItem(null, null);

  /// Factory for null item.
  static InkListItem null_() => nullItem;

  /// Whether this is the null item.
  bool get isNull => originName == null && itemName == null;

  /// The full name as "OriginName.ItemName".
  String get fullName => '${originName ?? "?"}.$itemName';

  @override
  String toString() => fullName;

  /// Check equality with another item.
  bool equals(InkListItem other) {
    return other.itemName == itemName && other.originName == originName;
  }

  @override
  bool operator ==(Object other) {
    if (other is InkListItem) {
      return equals(other);
    }
    return false;
  }

  @override
  int get hashCode => Object.hash(originName, itemName);

  /// Create a copy of this item.
  InkListItem copy() => InkListItem(originName, itemName);

  /// Get a serialization key for use in maps.
  String get serialized => '$originName|$itemName';

  /// Reconstruct an item from a serialized key.
  static InkListItem fromSerializedKey(String key) {
    final parts = key.split('|');
    if (parts.length == 2) {
      final origin = parts[0] == 'null' ? null : parts[0];
      final item = parts[1] == 'null' ? null : parts[1];
      return InkListItem(origin, item);
    }
    return InkListItem.nullItem;
  }
}

/// A key-value pair for InkList items.
class InkListEntry {
  final InkListItem key;
  final int value;

  const InkListEntry(this.key, this.value);
}

/// An ordered set of named items with integer values.
///
/// Provides set operations and comparison based on item values.
class InkList {
  final Map<String, int> _items = {};
  List<ListDefinition>? origins;
  List<String>? _originNames = [];

  /// Create an empty list.
  InkList();

  /// Create a copy of another list.
  InkList.from(InkList other) {
    _items.addAll(other._items);
    if (other._originNames != null) {
      _originNames = List.from(other._originNames!);
    }
    if (other.origins != null) {
      origins = List.from(other.origins!);
    }
  }

  /// Create a list with a single item.
  InkList.fromItem(InkListItem item, int value) {
    add(item, value);
  }

  /// Create a list from entry.
  InkList.fromEntry(InkListEntry entry) {
    add(entry.key, entry.value);
  }

  /// Number of items in the list.
  int get length => _items.length;

  /// Whether the list is empty.
  bool get isEmpty => _items.isEmpty;

  /// Whether the list has items.
  bool get isNotEmpty => _items.isNotEmpty;

  /// The origin names of items in this list.
  List<String> get originNames {
    if (isNotEmpty) {
      _originNames ??= [];
      _originNames!.clear();

      for (final key in _items.keys) {
        final item = InkListItem.fromSerializedKey(key);
        if (item.originName != null) {
          if (!_originNames!.contains(item.originName)) {
            _originNames!.add(item.originName!);
          }
        }
      }
    }
    return _originNames ?? [];
  }

  /// Set the initial origin name.
  void setInitialOriginName(String originName) {
    _originNames = [originName];
  }

  /// Set initial origin names.
  void setInitialOriginNames(List<String>? names) {
    if (names == null) {
      _originNames = null;
    } else {
      _originNames = List.from(names);
    }
  }

  /// Add an item to the list.
  void add(InkListItem item, int value) {
    final key = item.serialized;
    if (_items.containsKey(key)) {
      throw StateError('The list already contains an entry for $item');
    }
    _items[key] = value;
  }

  /// Remove an item from the list.
  bool remove(InkListItem item) {
    return _items.remove(item.serialized) != null;
  }

  /// Check if list contains an item.
  bool containsKey(InkListItem item) {
    return _items.containsKey(item.serialized);
  }

  /// Check if list contains an item by name.
  bool containsItemNamed(String itemName) {
    for (final key in _items.keys) {
      final item = InkListItem.fromSerializedKey(key);
      if (item.itemName == itemName) return true;
    }
    return false;
  }

  /// Get the value for an item.
  int? getValue(InkListItem item) {
    return _items[item.serialized];
  }

  /// Get all items as entries, ordered by value.
  List<InkListEntry> get orderedItems {
    final entries = <InkListEntry>[];

    for (final entry in _items.entries) {
      final item = InkListItem.fromSerializedKey(entry.key);
      entries.add(InkListEntry(item, entry.value));
    }

    entries.sort((a, b) {
      if (a.value == b.value) {
        return (a.key.originName ?? '').compareTo(b.key.originName ?? '');
      }
      return a.value.compareTo(b.value);
    });

    return entries;
  }

  /// Get the item with the highest value.
  InkListEntry? get maxItem {
    if (isEmpty) return null;

    InkListEntry? max;
    for (final entry in _items.entries) {
      final item = InkListItem.fromSerializedKey(entry.key);
      final current = InkListEntry(item, entry.value);
      if (max == null || entry.value > max.value) {
        max = current;
      }
    }
    return max;
  }

  /// Get the item with the lowest value.
  InkListEntry? get minItem {
    if (isEmpty) return null;

    InkListEntry? min;
    for (final entry in _items.entries) {
      final item = InkListItem.fromSerializedKey(entry.key);
      final current = InkListEntry(item, entry.value);
      if (min == null || entry.value < min.value) {
        min = current;
      }
    }
    return min;
  }

  /// Get a list containing only the max item.
  InkList maxAsList() {
    final max = maxItem;
    if (max != null) {
      return InkList.fromEntry(max);
    }
    return InkList();
  }

  /// Get a list containing only the min item.
  InkList minAsList() {
    final min = minItem;
    if (min != null) {
      return InkList.fromEntry(min);
    }
    return InkList();
  }

  /// Get the inverse (all items from origins not in this list).
  InkList get inverse {
    final list = InkList();
    if (origins != null) {
      for (final origin in origins!) {
        for (final entry in origin.items.entries) {
          final item = InkListItem(origin.name, entry.key);
          if (!containsKey(item)) {
            list.add(item, entry.value);
          }
        }
      }
    }
    return list;
  }

  /// Get all items from all origins.
  InkList get all {
    final list = InkList();
    if (origins != null) {
      for (final origin in origins!) {
        for (final entry in origin.items.entries) {
          final item = InkListItem(origin.name, entry.key);
          list._items[item.serialized] = entry.value;
        }
      }
    }
    return list;
  }

  /// Union of this list with another.
  InkList union(InkList other) {
    final result = InkList.from(this);
    for (final entry in other._items.entries) {
      result._items[entry.key] = entry.value;
    }
    return result;
  }

  /// Intersection of this list with another.
  InkList intersect(InkList other) {
    final result = InkList();
    for (final entry in _items.entries) {
      if (other._items.containsKey(entry.key)) {
        result._items[entry.key] = entry.value;
      }
    }
    return result;
  }

  /// Whether this list has any items in common with another.
  bool hasIntersection(InkList other) {
    for (final key in _items.keys) {
      if (other._items.containsKey(key)) return true;
    }
    return false;
  }

  /// This list without items from another list.
  InkList without(InkList listToRemove) {
    final result = InkList.from(this);
    for (final key in listToRemove._items.keys) {
      result._items.remove(key);
    }
    return result;
  }

  /// Check if this list contains another list (all items).
  bool contains(InkList other) {
    if (other.isEmpty || isEmpty) return false;
    for (final key in other._items.keys) {
      if (!_items.containsKey(key)) return false;
    }
    return true;
  }

  /// Whether all values in this list are greater than all in other.
  bool greaterThan(InkList other) {
    if (isEmpty) return false;
    if (other.isEmpty) return true;
    return minItem!.value > other.maxItem!.value;
  }

  /// Whether all values in this list are >= all in other.
  bool greaterThanOrEquals(InkList other) {
    if (isEmpty) return false;
    if (other.isEmpty) return true;
    return minItem!.value >= other.minItem!.value &&
        maxItem!.value >= other.maxItem!.value;
  }

  /// Whether all values in this list are less than all in other.
  bool lessThan(InkList other) {
    if (other.isEmpty) return false;
    if (isEmpty) return true;
    return maxItem!.value < other.minItem!.value;
  }

  /// Whether all values in this list are <= all in other.
  bool lessThanOrEquals(InkList other) {
    if (other.isEmpty) return false;
    if (isEmpty) return true;
    return maxItem!.value <= other.maxItem!.value &&
        minItem!.value <= other.minItem!.value;
  }

  /// Get a subrange of items by value bounds.
  InkList listWithSubRange(dynamic minBound, dynamic maxBound) {
    if (isEmpty) return InkList();

    int minValue = 0;
    int maxValue = 0x7FFFFFFF; // Max safe int

    if (minBound is int) {
      minValue = minBound;
    } else if (minBound is InkList && minBound.isNotEmpty) {
      minValue = minBound.minItem!.value;
    }

    if (maxBound is int) {
      maxValue = maxBound;
    } else if (maxBound is InkList && maxBound.isNotEmpty) {
      maxValue = maxBound.maxItem!.value;
    }

    final subList = InkList();
    subList.setInitialOriginNames(originNames);

    for (final entry in orderedItems) {
      if (entry.value >= minValue && entry.value <= maxValue) {
        subList.add(entry.key, entry.value);
      }
    }

    return subList;
  }

  /// Check equality with another list.
  bool equals(InkList other) {
    if (other.length != length) return false;

    for (final key in _items.keys) {
      if (!other._items.containsKey(key)) return false;
    }

    return true;
  }

  @override
  bool operator ==(Object other) {
    if (other is InkList) {
      return equals(other);
    }
    return false;
  }

  @override
  int get hashCode => _items.hashCode;

  /// Get the single item if list has exactly one.
  InkListItem? get singleItem {
    if (_items.length == 1) {
      return InkListItem.fromSerializedKey(_items.keys.first);
    }
    return null;
  }

  @override
  String toString() {
    final ordered = orderedItems;
    final buffer = StringBuffer();

    for (int i = 0; i < ordered.length; i++) {
      if (i > 0) buffer.write(', ');
      buffer.write(ordered[i].key.itemName ?? '');
    }

    return buffer.toString();
  }

  /// Iterate over entries.
  Iterable<MapEntry<String, int>> get entries => _items.entries;

  /// Get all serialized keys.
  Iterable<String> get keys => _items.keys;
}
