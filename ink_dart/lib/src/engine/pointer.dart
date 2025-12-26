import 'ink_object.dart';
import 'container.dart';
import 'path.dart';

/// A pointer to a specific position within a Container.
///
/// Combines a Container reference with an index into its content.
class Pointer {
  /// The container this pointer points into.
  Container? container;

  /// The index within the container's content.
  int index;

  Pointer(this.container, this.index);

  /// Create a pointer to the start of a container.
  Pointer.startOf(Container container) : this(container, 0);

  /// Create a null pointer.
  Pointer.null_()
      : container = null,
        index = -1;

  /// Whether this is a null pointer.
  bool get isNull => container == null;

  /// The element at this pointer's position.
  InkObject? get element {
    if (container == null || index < 0) return null;
    if (index >= container!.content.length) return null;
    return container!.content[index];
  }

  /// Resolve the pointer to get the object at this position.
  InkObject? resolve() {
    if (index < 0) return container;
    return element;
  }

  /// The path to this pointer's position.
  Path? get path {
    if (isNull) return null;
    return container!.path.pathByAppendingComponent(
      PathComponent.fromIndex(index),
    );
  }

  /// Create a copy of this pointer.
  Pointer copy() => Pointer(container, index);

  @override
  String toString() {
    if (isNull) {
      return 'Pointer.null';
    }
    return 'Pointer(${path?.componentsString ?? "?"})';
  }

  @override
  bool operator ==(Object other) {
    if (other is Pointer) {
      return container == other.container && index == other.index;
    }
    return false;
  }

  @override
  int get hashCode => Object.hash(container, index);
}
