import 'ink_list.dart';

/// Definition of a single LIST in Ink.
///
/// Contains the mapping of item names to their integer values.
class ListDefinition {
  /// The name of the list (e.g., "Colors", "Items").
  final String name;

  /// Raw items stored as serialized keys to values.
  final Map<String, int> _items;

  ListDefinition(this.name, Map<String, int> items) : _items = items;

  /// All items in this definition.
  Map<String, int> get items => _items;

  /// Get an item by value.
  ({bool exists, InkListItem? result}) tryGetItemWithValue(
    int value,
    InkListItem defaultValue,
  ) {
    for (final entry in _items.entries) {
      if (entry.value == value) {
        return (exists: true, result: InkListItem(name, entry.key));
      }
    }
    return (exists: false, result: defaultValue);
  }

  /// Get value for an item.
  ({bool exists, int? result}) tryGetValueForItem(InkListItem item) {
    final key = item.itemName;
    if (key != null && _items.containsKey(key)) {
      return (exists: true, result: _items[key]);
    }
    return (exists: false, result: null);
  }

  /// Check if this definition contains an item.
  bool containsItem(InkListItem item) {
    final key = item.itemName;
    return key != null && _items.containsKey(key);
  }

  /// Check if this definition contains an item by name.
  bool containsItemWithName(String itemName) {
    return _items.containsKey(itemName);
  }

  @override
  String toString() => 'ListDefinition($name, ${_items.length} items)';
}
