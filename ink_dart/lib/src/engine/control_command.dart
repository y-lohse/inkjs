import 'ink_object.dart';

/// Types of control commands used in the Ink runtime.
enum CommandType {
  evalStart,
  evalEnd,
  evalOutput,
  noOp,
  duplicate,
  popEvaluatedValue,
  popFunction,
  popTunnel,
  beginString,
  endString,
  pushToThread,
  popThread,
  startThread,
  done,
  end,
  listFromInt,
  listRange,
  listRandom,
  choiceCount,
  turns,
  turnsSince,
  readCount,
  random,
  seedRandom,
  visitIndex,
  sequenceShuffleIndex,
  beginTag,
  endTag,
  /// Sentinel value for total count of commands.
  totalValues,
}

/// Internal control flow command in the Ink runtime.
///
/// These commands control the execution flow, evaluation stack,
/// and other runtime behaviors.
class ControlCommand extends InkObject {
  final CommandType commandType;

  ControlCommand(this.commandType);

  // Static instances for common commands
  static final evalStart = ControlCommand(CommandType.evalStart);
  static final evalEnd = ControlCommand(CommandType.evalEnd);
  static final evalOutput = ControlCommand(CommandType.evalOutput);
  static final noOp = ControlCommand(CommandType.noOp);
  static final duplicate = ControlCommand(CommandType.duplicate);
  static final popEvaluatedValue = ControlCommand(CommandType.popEvaluatedValue);
  static final popFunction = ControlCommand(CommandType.popFunction);
  static final popTunnel = ControlCommand(CommandType.popTunnel);
  static final beginString = ControlCommand(CommandType.beginString);
  static final endString = ControlCommand(CommandType.endString);
  static final pushToThread = ControlCommand(CommandType.pushToThread);
  static final popThread = ControlCommand(CommandType.popThread);
  static final startThread = ControlCommand(CommandType.startThread);
  static final done = ControlCommand(CommandType.done);
  static final end = ControlCommand(CommandType.end);
  static final listFromInt = ControlCommand(CommandType.listFromInt);
  static final listRange = ControlCommand(CommandType.listRange);
  static final listRandom = ControlCommand(CommandType.listRandom);
  static final choiceCount = ControlCommand(CommandType.choiceCount);
  static final turns = ControlCommand(CommandType.turns);
  static final turnsSince = ControlCommand(CommandType.turnsSince);
  static final readCount = ControlCommand(CommandType.readCount);
  static final random = ControlCommand(CommandType.random);
  static final seedRandom = ControlCommand(CommandType.seedRandom);
  static final visitIndex = ControlCommand(CommandType.visitIndex);
  static final sequenceShuffleIndex = ControlCommand(CommandType.sequenceShuffleIndex);
  static final beginTag = ControlCommand(CommandType.beginTag);
  static final endTag = ControlCommand(CommandType.endTag);

  /// Factory for creating pop commands.
  static ControlCommand popTunnelCmd() => ControlCommand(CommandType.popTunnel);
  static ControlCommand popFunctionCmd() => ControlCommand(CommandType.popFunction);

  /// Map from JSON string to command type.
  static final Map<String, CommandType> _nameToType = {
    'ev': CommandType.evalStart,
    '/ev': CommandType.evalEnd,
    'out': CommandType.evalOutput,
    'pop': CommandType.popEvaluatedValue,
    '->->': CommandType.popTunnel,
    '~ret': CommandType.popFunction,
    'du': CommandType.duplicate,
    'str': CommandType.beginString,
    '/str': CommandType.endString,
    'nop': CommandType.noOp,
    'choiceCnt': CommandType.choiceCount,
    'turn': CommandType.turns,
    'turns': CommandType.turnsSince,
    'readc': CommandType.readCount,
    'rnd': CommandType.random,
    'srnd': CommandType.seedRandom,
    'visit': CommandType.visitIndex,
    'seq': CommandType.sequenceShuffleIndex,
    'thread': CommandType.startThread,
    'done': CommandType.done,
    'end': CommandType.end,
    'listInt': CommandType.listFromInt,
    'range': CommandType.listRange,
    'lrnd': CommandType.listRandom,
    '#': CommandType.beginTag,
    '/#': CommandType.endTag,
  };

  /// Map from command type to JSON string.
  static final Map<CommandType, String> _typeToName = {
    for (final entry in _nameToType.entries) entry.value: entry.key,
  };

  /// Get command type from JSON name.
  static CommandType? typeFromName(String name) => _nameToType[name];

  /// Get JSON name from command type.
  static String? nameFromType(CommandType type) => _typeToName[type];

  /// Whether a string is a control command name.
  static bool isControlCommand(String name) => _nameToType.containsKey(name);

  @override
  String toString() => commandType.name;

  @override
  InkObject copy() => ControlCommand(commandType);
}
