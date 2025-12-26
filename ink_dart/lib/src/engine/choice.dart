import 'ink_object.dart';
import 'path.dart';
import 'call_stack.dart';

/// A runtime choice presented to the player.
///
/// Contains the text to display and the path to navigate to
/// when selected.
class Choice extends InkObject {
  /// The text to display for this choice.
  String text = '';

  /// Path to the source in the story (for debugging).
  String? sourcePath;

  /// Path to navigate to when this choice is selected.
  Path? targetPath;

  /// Index of this choice in the currentChoices list.
  int index = -1;

  /// Tags associated with this choice.
  List<String>? tags;

  /// Whether this is an invisible default choice.
  bool isInvisibleDefault = false;

  /// The thread when this choice was generated.
  Thread? threadAtGeneration;

  /// The original thread index.
  int originalThreadIndex = 0;

  /// Get the path to navigate to when chosen.
  Path get pathOnChoice => targetPath!;

  /// Get path string on choice.
  String? get pathStringOnChoice => targetPath?.componentsString;

  set pathStringOnChoice(String? value) {
    if (value == null) {
      targetPath = null;
    } else {
      targetPath = Path.fromString(value);
    }
  }

  /// Create a clone of this choice.
  Choice clone() {
    final c = Choice();
    c.text = text;
    c.sourcePath = sourcePath;
    c.targetPath = targetPath;
    c.index = index;
    c.tags = tags != null ? List.from(tags!) : null;
    c.isInvisibleDefault = isInvisibleDefault;
    c.threadAtGeneration = threadAtGeneration?.copy();
    c.originalThreadIndex = originalThreadIndex;
    return c;
  }

  @override
  String toString() => 'Choice($index: $text)';
}
