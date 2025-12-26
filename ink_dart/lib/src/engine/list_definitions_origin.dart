import 'ink_list.dart';
import 'list_definition.dart';
import 'value.dart';

/// Origin container for all LIST definitions in a story.
///
/// Provides lookup and resolution of list items across all
/// defined lists in the story.
class ListDefinitionsOrigin {
  final List<ListDefinition> _lists;
  final Map<String, ListDefinition> _lookup = {};

  ListDefinitionsOrigin(this._lists) {
    for (final def in _lists) {
      _lookup[def.name] = def;
    }
  }

  /// All list definitions.
  List<ListDefinition> get lists => _lists;

  /// Try to get a list definition by name.
  ({bool exists, ListDefinition? result}) tryListGetDefinition(
    String? name,
    ListDefinition? defaultValue,
  ) {
    if (name == null) {
      return (exists: false, result: defaultValue);
    }
    final def = _lookup[name];
    if (def != null) {
      return (exists: true, result: def);
    }
    return (exists: false, result: defaultValue);
  }

  /// Find a single-item list by name.
  ListValue? findSingleItemListWithName(String name) {
    for (final def in _lists) {
      if (def.containsItemWithName(name)) {
        final item = InkListItem.fromFullName('${def.name}.$name');
        final valueResult = def.tryGetValueForItem(item);
        if (valueResult.exists) {
          final list = InkList();
          list.add(item, valueResult.result!);
          return ListValue.fromList(list);
        }
      }
    }
    return null;
  }

  @override
  String toString() => 'ListDefinitionsOrigin(${_lists.length} lists)';
}
