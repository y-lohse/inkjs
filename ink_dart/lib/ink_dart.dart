/// Ink narrative scripting language runtime for Dart.
///
/// A complete port of inkjs - the JavaScript implementation of Ink.
/// Provides 100% parity with the inkjs runtime for executing compiled
/// Ink stories in Flutter and Dart applications.
library ink_dart;

// Core classes
export 'src/engine/ink_object.dart';
export 'src/engine/debug_metadata.dart';
export 'src/engine/path.dart';

// Value system
export 'src/engine/value.dart';
export 'src/engine/ink_list.dart';
export 'src/engine/void.dart';

// Runtime elements
export 'src/engine/pointer.dart';
export 'src/engine/control_command.dart';
export 'src/engine/glue.dart';
export 'src/engine/tag.dart';
export 'src/engine/container.dart';
export 'src/engine/divert.dart';
export 'src/engine/choice.dart';
export 'src/engine/choice_point.dart';
export 'src/engine/variable_reference.dart';
export 'src/engine/variable_assignment.dart';
export 'src/engine/native_function_call.dart';

// Execution state
export 'src/engine/call_stack.dart';
export 'src/engine/variables_state.dart';
export 'src/engine/story_state.dart';
export 'src/engine/flow.dart';
export 'src/engine/state_patch.dart';

// List support
export 'src/engine/list_definition.dart';
export 'src/engine/list_definitions_origin.dart';

// Story engine
export 'src/engine/story.dart' hide Void;

// Serialization
export 'src/engine/json_serialisation.dart' hide Void;
export 'src/engine/simple_json.dart';

// Utilities
export 'src/engine/story_exception.dart';
export 'src/engine/prng.dart';
