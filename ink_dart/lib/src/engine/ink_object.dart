import 'path.dart';
import 'debug_metadata.dart';
import 'container.dart';

/// Base class for all Ink runtime objects.
///
/// Provides common functionality for:
/// - Parent/child relationships
/// - Path computation and resolution
/// - Debug metadata
abstract class InkObject {
  /// Parent object in the content hierarchy.
  InkObject? parent;

  DebugMetadata? _debugMetadata;

  /// Debug metadata for this object.
  ///
  /// If not set on this object, inherits from parent.
  DebugMetadata? get debugMetadata {
    if (_debugMetadata == null && parent != null) {
      return parent!.debugMetadata;
    }
    return _debugMetadata;
  }

  set debugMetadata(DebugMetadata? value) {
    _debugMetadata = value;
  }

  /// Debug metadata owned by this object (not inherited).
  DebugMetadata? get ownDebugMetadata => _debugMetadata;

  Path? _path;

  /// The path to this object from the root.
  ///
  /// Computed lazily and cached.
  Path get path {
    if (_path == null) {
      if (parent == null) {
        _path = Path();
      } else {
        final comps = <PathComponent>[];

        InkObject child = this;
        Container? container = child.parent is Container
            ? child.parent as Container
            : null;

        while (container != null) {
          final namedChild = child is INamedContent ? child as INamedContent : null;
          if (namedChild != null && namedChild.hasValidName) {
            comps.insert(0, PathComponent.fromName(namedChild.name!));
          } else {
            comps.insert(0, PathComponent.fromIndex(container.content.indexOf(child)));
          }

          child = container;
          container = container.parent is Container
              ? container.parent as Container
              : null;
        }

        _path = Path.fromComponents(comps);
      }
    }
    return _path!;
  }

  /// Get the line number in the source for the given path.
  int? debugLineNumberOfPath(Path? path) {
    if (path == null) return null;

    final root = rootContentContainer;
    if (root != null) {
      final targetContent = root.contentAtPath(path).obj;
      if (targetContent != null) {
        final dm = targetContent.debugMetadata;
        if (dm != null) {
          return dm.startLineNumber;
        }
      }
    }

    return null;
  }

  /// Resolve a path from this object's position.
  SearchResult resolvePath(Path path) {
    if (path.isRelative) {
      Container? nearestContainer = this is Container ? this as Container : null;

      if (nearestContainer == null) {
        assert(parent != null, "Can't resolve relative path without a parent");
        nearestContainer = parent is Container ? parent as Container : null;
        assert(nearestContainer != null, "Expected parent to be a container");
        assert(path.getComponent(0).isParent);
        path = path.tail;
      }

      return nearestContainer!.contentAtPath(path);
    } else {
      final contentContainer = rootContentContainer;
      if (contentContainer == null) {
        throw StateError('Could not find root content container');
      }
      return contentContainer.contentAtPath(path);
    }
  }

  /// Convert a global path to a relative path from this object.
  Path convertPathToRelative(Path globalPath) {
    final ownPath = path;

    final minPathLength = globalPath.length < ownPath.length
        ? globalPath.length
        : ownPath.length;
    int lastSharedPathCompIndex = -1;

    for (int i = 0; i < minPathLength; ++i) {
      final ownComp = ownPath.getComponent(i);
      final otherComp = globalPath.getComponent(i);

      if (ownComp.equals(otherComp)) {
        lastSharedPathCompIndex = i;
      } else {
        break;
      }
    }

    // No shared path components, so just use global path
    if (lastSharedPathCompIndex == -1) return globalPath;

    final numUpwardsMoves = ownPath.componentCount - 1 - lastSharedPathCompIndex;

    final newPathComps = <PathComponent>[];

    for (int up = 0; up < numUpwardsMoves; ++up) {
      newPathComps.add(PathComponent.toParent());
    }

    for (int down = lastSharedPathCompIndex + 1; down < globalPath.componentCount; ++down) {
      newPathComps.add(globalPath.getComponent(down));
    }

    return Path.fromComponents(newPathComps, relative: true);
  }

  /// Get the shorter of the relative or absolute path string.
  String compactPathString(Path otherPath) {
    String globalPathStr;
    String relativePathStr;

    if (otherPath.isRelative) {
      relativePathStr = otherPath.componentsString;
      globalPathStr = path.pathByAppendingPath(otherPath).componentsString;
    } else {
      final relativePath = convertPathToRelative(otherPath);
      relativePathStr = relativePath.componentsString;
      globalPathStr = otherPath.componentsString;
    }

    if (relativePathStr.length < globalPathStr.length) {
      return relativePathStr;
    }
    return globalPathStr;
  }

  /// The root Container of the content hierarchy.
  Container? get rootContentContainer {
    InkObject ancestor = this;
    while (ancestor.parent != null) {
      ancestor = ancestor.parent!;
    }
    return ancestor is Container ? ancestor : null;
  }

  /// Create a copy of this object.
  ///
  /// Override in subclasses that support copying.
  InkObject copy() {
    throw UnimplementedError("Doesn't support copying");
  }

  /// Set a child property with proper parent tracking.
  void setChild<T extends InkObject>(
    void Function(T?) setter,
    T? value,
  ) {
    setter(value);
    if (value != null) {
      value.parent = this;
    }
  }
}

/// Mixin for content that has a name.
mixin INamedContent {
  String? get name;
  bool get hasValidName => name != null && name!.isNotEmpty;
}

/// Result of searching for content at a path.
class SearchResult {
  InkObject? obj;
  bool approximate = false;

  SearchResult();

  /// The object if found exactly (not approximate).
  InkObject? get correctObj => approximate ? null : obj;

  /// The object as a dynamic type (cast to Container in usage).
  dynamic get container => obj;
}
