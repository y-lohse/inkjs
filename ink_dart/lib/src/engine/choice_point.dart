import 'ink_object.dart';
import 'path.dart';
import 'container.dart';

/// A choice point in the compiled story.
///
/// Defines the structure of a choice including conditions,
/// content, and flags.
class ChoicePoint extends InkObject {
  Path? _pathOnChoice;

  /// Whether this choice has a condition.
  bool hasCondition = false;

  /// Whether this choice has start content.
  bool hasStartContent = false;

  /// Whether this choice has choice-only content.
  bool hasChoiceOnlyContent = false;

  /// Whether this is an invisible default choice.
  bool isInvisibleDefault = false;

  /// Whether this choice can only be taken once.
  bool onceOnly = true;

  /// The path to the choice content.
  Path? get pathOnChoice => _pathOnChoice;

  set pathOnChoice(Path? value) {
    _pathOnChoice = value;
  }

  /// The container for the choice content.
  Container? get choiceTarget {
    if (_pathOnChoice == null) return null;
    final result = resolvePath(_pathOnChoice!);
    return result.container;
  }

  /// Get the path string on choice.
  String? get pathStringOnChoice {
    if (_pathOnChoice == null) return null;
    return compactPathString(_pathOnChoice!);
  }

  set pathStringOnChoice(String? value) {
    if (value == null) {
      _pathOnChoice = null;
    } else {
      _pathOnChoice = Path.fromString(value);
    }
  }

  /// Packed flags for serialization.
  int get flags {
    int flags = 0;
    if (hasCondition) flags |= 1;
    if (hasStartContent) flags |= 2;
    if (hasChoiceOnlyContent) flags |= 4;
    if (isInvisibleDefault) flags |= 8;
    if (onceOnly) flags |= 16;
    return flags;
  }

  /// Unpack flags from serialization.
  set flags(int value) {
    hasCondition = (value & 1) > 0;
    hasStartContent = (value & 2) > 0;
    hasChoiceOnlyContent = (value & 4) > 0;
    isInvisibleDefault = (value & 8) > 0;
    onceOnly = (value & 16) > 0;
  }

  @override
  String toString() {
    int targetId = -1;
    if (_pathOnChoice != null) {
      targetId = _pathOnChoice!.length > 0
          ? _pathOnChoice!.getComponent(0).index
          : -1;
    }
    return 'ChoicePoint(target: $targetId, flags: $flags)';
  }
}
