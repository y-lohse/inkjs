/// Path represents a location within the story content hierarchy.
///
/// Paths can be absolute (from root) or relative (from current position).
/// Components can be either named (string) or indexed (int).
///
/// Examples:
/// - "knot.stitch.0" - absolute path to first element of stitch
/// - ".^.sibling" - relative path: go up then to sibling
class Path {
  static const String parentId = '^';

  final List<PathComponent> _components = [];
  bool _isRelative = false;
  String? _componentsString;

  /// Create an empty path.
  Path();

  /// Create a path from a string representation.
  ///
  /// Format: "component.component.component"
  /// Relative paths start with "."
  /// Parent references use "^"
  Path.fromString(String componentsString) {
    this.componentsString = componentsString;
  }

  /// Create a path from components.
  Path.fromComponents(List<PathComponent> components, {bool relative = false}) {
    _components.addAll(components);
    _isRelative = relative;
  }

  /// Create a path by prepending a head component to a tail path.
  Path.fromHeadTail(PathComponent head, Path tail) {
    _components.add(head);
    _components.addAll(tail._components);
  }

  /// Whether this is a relative path (starts with .)
  bool get isRelative => _isRelative;

  /// Number of components in the path.
  int get componentCount => _components.length;

  /// Alias for componentCount.
  int get length => _components.length;

  /// First component of the path, or null if empty.
  PathComponent? get head {
    if (_components.isNotEmpty) {
      return _components[0];
    }
    return null;
  }

  /// Path without the first component.
  Path get tail {
    if (_components.length >= 2) {
      return Path.fromComponents(_components.sublist(1));
    }
    return Path.self;
  }

  /// Last component of the path, or null if empty.
  PathComponent? get lastComponent {
    if (_components.isNotEmpty) {
      return _components.last;
    }
    return null;
  }

  /// Whether any component is a named (string) component.
  bool get containsNamedComponent {
    for (final comp in _components) {
      if (!comp.isIndex) {
        return true;
      }
    }
    return false;
  }

  /// A relative empty path (represents "self").
  static Path get self {
    final path = Path();
    path._isRelative = true;
    return path;
  }

  /// Get component at the given index.
  PathComponent getComponent(int index) => _components[index];

  /// Create a new path by appending another path.
  ///
  /// Handles parent references (^) by moving up the hierarchy.
  Path pathByAppendingPath(Path pathToAppend) {
    final p = Path();

    int upwardMoves = 0;
    for (int i = 0; i < pathToAppend._components.length; ++i) {
      if (pathToAppend._components[i].isParent) {
        upwardMoves++;
      } else {
        break;
      }
    }

    for (int i = 0; i < _components.length - upwardMoves; ++i) {
      p._components.add(_components[i]);
    }

    for (int i = upwardMoves; i < pathToAppend._components.length; ++i) {
      p._components.add(pathToAppend._components[i]);
    }

    return p;
  }

  /// Create a new path by appending a single component.
  Path pathByAppendingComponent(PathComponent c) {
    final p = Path();
    p._components.addAll(_components);
    p._components.add(c);
    return p;
  }

  /// String representation of the path.
  String get componentsString {
    if (_componentsString == null) {
      _componentsString = _components.join('.');
      if (isRelative) {
        _componentsString = '.$_componentsString';
      }
    }
    return _componentsString!;
  }

  /// Parse a string into path components.
  set componentsString(String value) {
    _components.clear();
    _componentsString = value;

    if (_componentsString == null || _componentsString!.isEmpty) return;

    String parseStr = _componentsString!;

    if (parseStr[0] == '.') {
      _isRelative = true;
      parseStr = parseStr.substring(1);
    }

    if (parseStr.isEmpty) return;

    final componentStrings = parseStr.split('.');
    for (final str in componentStrings) {
      // Check if it's a pure integer (not a named component starting with digits)
      if (RegExp(r'^(-|\+)?([0-9]+|Infinity)$').hasMatch(str)) {
        _components.add(PathComponent.fromIndex(int.parse(str)));
      } else {
        _components.add(PathComponent.fromName(str));
      }
    }
  }

  @override
  String toString() => componentsString;

  /// Check equality with another path.
  bool equals(Path? otherPath) {
    if (otherPath == null) return false;
    if (otherPath._components.length != _components.length) return false;
    if (otherPath.isRelative != isRelative) return false;

    for (int i = 0; i < _components.length; i++) {
      if (!_components[i].equals(otherPath._components[i])) {
        return false;
      }
    }

    return true;
  }

  @override
  bool operator ==(Object other) {
    if (other is Path) {
      return equals(other);
    }
    return false;
  }

  @override
  int get hashCode => componentsString.hashCode;
}

/// A single component of a Path.
///
/// Can be either:
/// - An index (int >= 0) for positional access
/// - A name (string) for named content access
/// - Parent reference (^) for going up the hierarchy
class PathComponent {
  final int index;
  final String? name;

  /// Create a component from an index.
  PathComponent.fromIndex(this.index) : name = null;

  /// Create a component from a name.
  PathComponent.fromName(this.name) : index = -1;

  /// Create a parent reference component.
  factory PathComponent.toParent() => PathComponent.fromName(Path.parentId);

  /// Whether this component is an index (vs a name).
  bool get isIndex => index >= 0;

  /// Whether this component is a parent reference (^).
  bool get isParent => name == Path.parentId;

  @override
  String toString() {
    if (isIndex) {
      return index.toString();
    }
    return name ?? '';
  }

  /// Check equality with another component.
  bool equals(PathComponent other) {
    if (isIndex == other.isIndex) {
      if (isIndex) {
        return index == other.index;
      } else {
        return name == other.name;
      }
    }
    return false;
  }

  @override
  bool operator ==(Object other) {
    if (other is PathComponent) {
      return equals(other);
    }
    return false;
  }

  @override
  int get hashCode => isIndex ? index.hashCode : (name?.hashCode ?? 0);
}
