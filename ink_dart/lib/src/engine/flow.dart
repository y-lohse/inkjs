import 'ink_object.dart';
import 'call_stack.dart';
import 'choice.dart';
import 'simple_json.dart';
import 'container.dart';

/// A single flow of execution in the story.
///
/// Flows allow parallel story execution paths. Each flow
/// maintains its own callstack, output, and choices.
class Flow {
  String name;
  late CallStack callStack;
  List<InkObject> outputStream = [];
  List<Choice> currentChoices = [];

  Flow(this.name, [dynamic story, Map<String, dynamic>? jObject]) {
    // Get the mainContentContainer from the story if available
    Container? rootContainer;
    if (story != null) {
      try {
        rootContainer = story.mainContentContainer;
      } catch (_) {
        // Story might not have mainContentContainer yet
      }
    }

    callStack = CallStack(rootContainer);

    // If loading from JSON
    if (jObject != null) {
      loadJson(jObject, story);
    }
  }

  /// Create a copy of this flow.
  Flow copy() {
    final copied = Flow(name);
    copied.callStack = CallStack.from(callStack);
    copied.outputStream = List.from(outputStream);
    copied.currentChoices = List.from(currentChoices);
    return copied;
  }

  /// Load flow from JSON.
  void loadJson(Map<String, dynamic> json, dynamic story) {
    if (json.containsKey('callstack')) {
      final callstackJson = json['callstack'] as Map<String, dynamic>;
      callStack.loadJson(callstackJson, null);
    }
    // TODO: Load outputStream and currentChoices
  }

  /// Load choice threads from JSON.
  void loadFlowChoiceThreads(Map<String, dynamic>? jChoiceThreadsObj, dynamic story) {
    // TODO: Implement choice thread loading
  }

  /// Write flow to JSON.
  void writeJson(SimpleJsonWriter writer) {
    writer.writeObjectStart();
    writer.writePropertyStart('callstack');
    // TODO: Write callstack JSON
    writer.writeObjectEnd();
    writer.writePropertyEnd();
    writer.writeObjectEnd();
  }
}
