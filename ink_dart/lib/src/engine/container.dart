import 'ink_object.dart';
import 'path.dart';
import 'value.dart';

/// Flags for visit counting behavior.
class CountFlags {
  static const int visits = 1;
  static const int turns = 2;
  static const int countStartOnly = 4;
}

/// Container that holds story content in a hierarchy.
///
/// Containers can hold:
/// - Other containers (knots, stitches)
/// - Text content
/// - Control commands
/// - Diverts, choices, etc.
class Container extends InkObject with INamedContent {
  @override
  String? name;

  final List<InkObject> _content = [];
  final Map<String, INamedContent> namedContent = {};

  bool visitsShouldBeCounted = false;
  bool turnIndexShouldBeCounted = false;
  bool countingAtStartOnly = false;

  Path? _pathToFirstLeafContent;

  @override
  bool get hasValidName => name != null && name!.isNotEmpty;

  /// The content objects in this container.
  List<InkObject> get content => _content;

  /// Set content, adding all items.
  set content(List<InkObject> value) {
    addContentList(value);
  }

  /// Get named-only content (not in content list).
  Map<String, InkObject>? get namedOnlyContent {
    final namedOnly = <String, InkObject>{};

    for (final entry in namedContent.entries) {
      if (entry.value is InkObject) {
        namedOnly[entry.key] = entry.value as InkObject;
      }
    }

    for (final c in content) {
      if (c is INamedContent) {
        final named = c as INamedContent;
        if (named.hasValidName && named.name != null) {
          namedOnly.remove(named.name);
        }
      }
    }

    return namedOnly.isEmpty ? null : namedOnly;
  }

  /// Set named-only content.
  set namedOnlyContent(Map<String, InkObject>? value) {
    final existing = namedOnlyContent;
    if (existing != null) {
      for (final key in existing.keys) {
        namedContent.remove(key);
      }
    }

    if (value == null) return;

    for (final val in value.values) {
      if (val is INamedContent) {
        addToNamedContentOnly(val as INamedContent);
      }
    }
  }

  /// Packed count flags for serialization.
  int get countFlags {
    int flags = 0;
    if (visitsShouldBeCounted) flags |= CountFlags.visits;
    if (turnIndexShouldBeCounted) flags |= CountFlags.turns;
    if (countingAtStartOnly) flags |= CountFlags.countStartOnly;

    // CountStartOnly is meaningless without Visits or Turns
    if (flags == CountFlags.countStartOnly) {
      flags = 0;
    }

    return flags;
  }

  /// Unpack count flags from serialization.
  set countFlags(int value) {
    if ((value & CountFlags.visits) > 0) visitsShouldBeCounted = true;
    if ((value & CountFlags.turns) > 0) turnIndexShouldBeCounted = true;
    if ((value & CountFlags.countStartOnly) > 0) countingAtStartOnly = true;
  }

  /// Path to the first leaf (non-container) content.
  Path get pathToFirstLeafContent {
    _pathToFirstLeafContent ??= path.pathByAppendingPath(internalPathToFirstLeafContent);
    return _pathToFirstLeafContent!;
  }

  /// Internal relative path to first leaf content.
  Path get internalPathToFirstLeafContent {
    final components = <PathComponent>[];
    InkObject current = this;

    while (current is Container) {
      final container = current;
      if (container.content.isNotEmpty) {
        components.add(PathComponent.fromIndex(0));
        current = container.content[0];
      } else {
        break;
      }
    }

    return Path.fromComponents(components);
  }

  /// Add a single content object.
  void addContent(InkObject contentObj) {
    _content.add(contentObj);

    if (contentObj.parent != null) {
      throw StateError('content is already in ${contentObj.parent}');
    }

    contentObj.parent = this;
    tryAddNamedContent(contentObj);
  }

  /// Add multiple content objects.
  void addContentList(List<InkObject> contentList) {
    for (final c in contentList) {
      addContent(c);
    }
  }

  /// Try to add an object to named content if it has a valid name.
  void tryAddNamedContent(InkObject contentObj) {
    if (contentObj is INamedContent) {
      final named = contentObj as INamedContent;
      if (named.hasValidName) {
        addToNamedContentOnly(named);
      }
    }
  }

  /// Add to named content only (not to content list).
  void addToNamedContentOnly(INamedContent namedContentObj) {
    if (namedContentObj is! InkObject) {
      throw ArgumentError('Can only add InkObjects to a Container');
    }

    final runtimeObj = namedContentObj as InkObject;
    runtimeObj.parent = this;

    if (namedContentObj.name == null) {
      throw StateError('namedContentObj.name is null');
    }

    namedContent[namedContentObj.name!] = namedContentObj;
  }

  /// Find content at a path.
  SearchResult contentAtPath(
    Path path, {
    int partialPathStart = 0,
    int partialPathLength = -1,
  }) {
    if (partialPathLength == -1) partialPathLength = path.length;

    final result = SearchResult();
    result.approximate = false;

    Container? currentContainer = this;
    InkObject currentObj = this;

    for (int i = partialPathStart; i < partialPathLength; ++i) {
      final comp = path.getComponent(i);

      if (currentContainer == null) {
        result.approximate = true;
        break;
      }

      final foundObj = currentContainer.contentWithPathComponent(comp);

      if (foundObj == null) {
        result.approximate = true;
        break;
      }

      // Check if next object is a container (for continuing traversal)
      final nextContainer = foundObj is Container ? foundObj : null;
      if (i < partialPathLength - 1 && nextContainer == null) {
        result.approximate = true;
        break;
      }

      currentObj = foundObj;
      currentContainer = nextContainer;
    }

    result.obj = currentObj;
    return result;
  }

  /// Insert content at a specific index.
  void insertContent(InkObject contentObj, int index) {
    content.insert(index, contentObj);

    if (contentObj.parent != null) {
      throw StateError('content is already in ${contentObj.parent}');
    }

    contentObj.parent = this;
    tryAddNamedContent(contentObj);
  }

  /// Add all content from another container.
  void addContentsOfContainer(Container otherContainer) {
    for (final obj in otherContainer.content) {
      obj.parent = this;
      _content.add(obj);
      tryAddNamedContent(obj);
    }
  }

  /// Find content by path component.
  InkObject? contentWithPathComponent(PathComponent component) {
    if (component.isIndex) {
      if (component.index >= 0 && component.index < content.length) {
        return content[component.index];
      }
      return null;
    } else if (component.isParent) {
      return parent;
    } else {
      if (component.name == null) {
        throw StateError('component.name is null');
      }

      final found = namedContent[component.name];
      if (found != null && found is InkObject) {
        return found as InkObject;
      }
      return null;
    }
  }

  /// Build a debug string representation of the hierarchy.
  String buildStringOfHierarchy([
    StringBuffer? sb,
    int indentation = 0,
    InkObject? pointedObj,
  ]) {
    sb ??= StringBuffer();
    const spacesPerIndent = 4;

    void appendIndentation() {
      for (int i = 0; i < spacesPerIndent * indentation; ++i) {
        sb!.write(' ');
      }
    }

    appendIndentation();
    sb.write('[');

    if (hasValidName) {
      sb.write(' ($name)');
    }

    if (this == pointedObj) {
      sb.write('  <---');
    }

    sb.writeln();

    indentation++;

    for (int i = 0; i < content.length; ++i) {
      final obj = content[i];

      if (obj is Container) {
        obj.buildStringOfHierarchy(sb, indentation, pointedObj);
      } else {
        appendIndentation();
        if (obj is StringValue) {
          sb.write('"');
          sb.write(obj.toString().replaceAll('\n', '\\n'));
          sb.write('"');
        } else {
          sb.write(obj.toString());
        }
      }

      if (i != content.length - 1) {
        sb.write(',');
      }

      if (obj is! Container && obj == pointedObj) {
        sb.write('  <---');
      }

      sb.writeln();
    }

    // Named-only content
    final onlyNamed = <String, INamedContent>{};
    for (final entry in namedContent.entries) {
      if (entry.value is InkObject &&
          !content.contains(entry.value as InkObject)) {
        onlyNamed[entry.key] = entry.value;
      }
    }

    if (onlyNamed.isNotEmpty) {
      appendIndentation();
      sb.writeln('-- named: --');

      for (final value in onlyNamed.values) {
        if (value is Container) {
          value.buildStringOfHierarchy(sb, indentation, pointedObj);
          sb.writeln();
        }
      }
    }

    indentation--;

    appendIndentation();
    sb.write(']');

    return sb.toString();
  }

  @override
  String toString() => 'Container(${name ?? "unnamed"})';
}
