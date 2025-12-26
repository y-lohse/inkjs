import 'ink_object.dart';
import 'container.dart';

/// Temporary storage for state changes during background saves.
///
/// Allows the story to continue progressing while a background
/// save is in progress without corrupting the saved state.
class StatePatch {
  final Map<String, InkObject> _globals = {};
  final Map<Container, int> _visitCounts = {};
  final Map<Container, int> _turnIndices = {};
  final Set<String> _changedVariables = {};

  StatePatch([StatePatch? toCopy]) {
    if (toCopy != null) {
      _globals.addAll(toCopy._globals);
      _visitCounts.addAll(toCopy._visitCounts);
      _turnIndices.addAll(toCopy._turnIndices);
      _changedVariables.addAll(toCopy._changedVariables);
    }
  }

  /// All globals in the patch.
  Map<String, InkObject> get globals => _globals;

  /// All visit counts in the patch.
  Map<Container, int> get visitCounts => _visitCounts;

  /// All turn indices in the patch.
  Map<Container, int> get turnIndices => _turnIndices;

  /// Changed variable names.
  Set<String> get changedVariables => _changedVariables;

  /// Try to get a global variable from the patch.
  ({bool exists, InkObject? result}) tryGetGlobal(String? name, InkObject? defaultValue) {
    if (name != null && _globals.containsKey(name)) {
      return (exists: true, result: _globals[name]);
    }
    return (exists: false, result: defaultValue);
  }

  /// Set a global variable in the patch.
  void setGlobal(String name, InkObject value) {
    _globals[name] = value;
  }

  /// Add a variable to the changed set.
  void addChangedVariable(String name) {
    _changedVariables.add(name);
  }

  /// Try to get visit count for a container.
  ({bool exists, int? result}) tryGetVisitCount(Container container, int defaultValue) {
    if (_visitCounts.containsKey(container)) {
      return (exists: true, result: _visitCounts[container]);
    }
    return (exists: false, result: defaultValue);
  }

  /// Set visit count for a container.
  void setVisitCount(Container container, int count) {
    _visitCounts[container] = count;
  }

  /// Try to get turn index for a container.
  ({bool exists, int? result}) tryGetTurnIndex(Container container, int defaultValue) {
    if (_turnIndices.containsKey(container)) {
      return (exists: true, result: _turnIndices[container]);
    }
    return (exists: false, result: defaultValue);
  }

  /// Set turn index for a container.
  void setTurnIndex(Container container, int index) {
    _turnIndices[container] = index;
  }
}
