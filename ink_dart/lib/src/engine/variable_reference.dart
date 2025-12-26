import 'ink_object.dart';
import 'path.dart';
import 'container.dart';

/// A reference to a variable in the story.
///
/// Can be either a normal variable reference or a
/// reference for visit counting.
class VariableReference extends InkObject {
  /// The name of the variable.
  String? name;

  /// Path for visit count references.
  Path? pathForCount;

  VariableReference([this.name]);

  /// Create a visit count reference.
  factory VariableReference.forCount(Path pathForCount) {
    final ref = VariableReference();
    ref.pathForCount = pathForCount;
    return ref;
  }

  /// The container for visit counting (resolved from path).
  Container? get containerForCount {
    if (pathForCount == null) return null;
    return resolvePath(pathForCount!).container;
  }

  /// The string representation of the path for count.
  String? get pathStringForCount {
    if (pathForCount == null) return null;
    return compactPathString(pathForCount!);
  }

  set pathStringForCount(String? value) {
    if (value == null) {
      pathForCount = null;
    } else {
      pathForCount = Path.fromString(value);
    }
  }

  @override
  String toString() {
    if (name != null) {
      return 'VarRef($name)';
    } else if (pathForCount != null) {
      return 'VarRef(count: $pathStringForCount)';
    }
    return 'VarRef(?)';
  }
}
