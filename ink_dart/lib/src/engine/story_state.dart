import 'ink_object.dart';
import 'value.dart';
import 'call_stack.dart';
import 'variables_state.dart';
import 'flow.dart';
import 'choice.dart';
import 'pointer.dart';
import 'container.dart';
import 'state_patch.dart';
import 'simple_json.dart';
import 'control_command.dart';
import 'glue.dart';
import 'tag.dart';
import 'divert.dart';
import 'prng.dart';
import 'path.dart';

/// The complete runtime state of a story.
///
/// Contains all information needed to save/restore story progress:
/// - Current execution position
/// - Variable values
/// - Visit counts
/// - Output stream
/// - Current choices
class StoryState {
  /// Save format version for compatibility.
  static const int kInkSaveStateVersion = 10;
  static const int kMinCompatibleLoadVersion = 8;

  /// Callback when state is loaded.
  void Function()? onDidLoadState;

  /// Reference to the story.
  dynamic story;

  late VariablesState _variablesState;
  final List<InkObject> _evaluationStack = [];

  Pointer divertedPointer = Pointer.null_();

  int _currentTurnIndex = 0;
  int storySeed = 0;
  int previousRandom = 0;
  bool didSafeExit = false;

  final Map<String, int> _visitCounts = {};
  final Map<String, int> _turnIndices = {};

  bool _outputStreamTextDirty = true;
  bool _outputStreamTagsDirty = true;

  StatePatch? _patch;

  late Flow _currentFlow;
  List<String>? _aliveFlowNames;
  Map<String, Flow>? _namedFlows;
  static const String kDefaultFlowName = 'DEFAULT_FLOW';
  bool _aliveFlowNamesDirty = true;

  String? _currentText;
  List<String>? _currentTags;
  List<String>? _currentErrors;
  List<String>? _currentWarnings;

  StoryState(this.story) {
    _currentFlow = Flow(kDefaultFlowName, story);
    outputStreamDirty();

    _aliveFlowNamesDirty = true;

    _variablesState = VariablesState(
      callStack,
      story?.listDefinitions,
    );

    _currentTurnIndex = -1;

    final timeSeed = DateTime.now().millisecondsSinceEpoch;
    storySeed = PRNG(timeSeed).next() % 100;
    previousRandom = 0;

    goToStart();
  }

  /// Serialize to JSON string.
  String toJson([bool indented = false]) {
    final writer = SimpleJsonWriter();
    writeJson(writer);
    return writer.toString();
  }

  /// Load from JSON string.
  void loadJson(String json) {
    final jObject = SimpleJson.textToDictionary(json);
    loadJsonObj(jObject);
    onDidLoadState?.call();
  }

  /// Get visit count for a path string.
  int visitCountAtPathString(String pathString) {
    if (_patch != null) {
      // TODO: Resolve container from path
    }
    return _visitCounts[pathString] ?? 0;
  }

  /// Get visit count for a container.
  int visitCountForContainer(Container? container) {
    if (container == null) return 0;

    if (!container.visitsShouldBeCounted) {
      // Error: visits not counted
      return 0;
    }

    if (_patch != null) {
      final count = _patch!.tryGetVisitCount(container, 0);
      if (count.exists) return count.result!;
    }

    final containerPathStr = container.path.toString();
    return _visitCounts[containerPathStr] ?? 0;
  }

  /// Increment visit count for a container.
  void incrementVisitCountForContainer(Container container) {
    if (_patch != null) {
      final currCount = visitCountForContainer(container);
      _patch!.setVisitCount(container, currCount + 1);
      return;
    }

    final containerPathStr = container.path.toString();
    _visitCounts[containerPathStr] = (_visitCounts[containerPathStr] ?? 0) + 1;
  }

  /// Record turn index visit for a container.
  void recordTurnIndexVisitToContainer(Container container) {
    if (_patch != null) {
      _patch!.setTurnIndex(container, currentTurnIndex);
      return;
    }

    final containerPathStr = container.path.toString();
    _turnIndices[containerPathStr] = currentTurnIndex;
  }

  /// Get turns since a container was visited.
  int turnsSinceForContainer(Container container) {
    if (!container.turnIndexShouldBeCounted) {
      return -1;
    }

    if (_patch != null) {
      final index = _patch!.tryGetTurnIndex(container, 0);
      if (index.exists) return currentTurnIndex - index.result!;
    }

    final containerPathStr = container.path.toString();
    final turnIndex = _turnIndices[containerPathStr];
    if (turnIndex != null) {
      return currentTurnIndex - turnIndex;
    }
    return -1;
  }

  /// Depth of the call stack.
  int get callstackDepth => callStack.depth;

  /// The output stream.
  List<InkObject> get outputStream => _currentFlow.outputStream;

  /// Current available choices.
  List<Choice> get currentChoices {
    if (canContinue) return [];
    return _currentFlow.currentChoices;
  }

  /// Generated choices (even if we can continue).
  List<Choice> get generatedChoices => _currentFlow.currentChoices;

  /// Current errors.
  List<String>? get currentErrors => _currentErrors;

  /// Current warnings.
  List<String>? get currentWarnings => _currentWarnings;

  /// Variables state.
  VariablesState get variablesState => _variablesState;
  set variablesState(VariablesState value) => _variablesState = value;

  /// Call stack.
  CallStack get callStack => _currentFlow.callStack;

  /// Evaluation stack.
  List<InkObject> get evaluationStack => _evaluationStack;

  /// Current turn index.
  int get currentTurnIndex => _currentTurnIndex;
  set currentTurnIndex(int value) => _currentTurnIndex = value;

  /// Current path string.
  String? get currentPathString {
    final pointer = currentPointer;
    if (pointer.isNull) return null;
    return pointer.path?.toString();
  }

  /// Previous path string.
  String? get previousPathString {
    final pointer = previousPointer;
    if (pointer.isNull) return null;
    return pointer.path?.toString();
  }

  /// Current pointer.
  Pointer get currentPointer => callStack.currentElement.currentPointer.copy();

  set currentPointer(Pointer value) {
    callStack.currentElement.currentPointer = value.copy();
  }

  /// Previous pointer.
  Pointer get previousPointer =>
      callStack.currentThread.previousPointer?.copy() ?? Pointer.null_();

  set previousPointer(Pointer value) {
    callStack.currentThread.previousPointer = value.copy();
  }

  /// Whether we can continue.
  bool get canContinue => !currentPointer.isNull && !hasError;

  /// Whether there are errors.
  bool get hasError => _currentErrors != null && _currentErrors!.isNotEmpty;

  /// Whether there are warnings.
  bool get hasWarning => _currentWarnings != null && _currentWarnings!.isNotEmpty;

  /// Current text output.
  String? get currentText {
    if (_outputStreamTextDirty) {
      final sb = StringBuffer();
      bool inTag = false;

      for (final outputObj in outputStream) {
        if (!inTag && outputObj is StringValue) {
          sb.write(outputObj.value);
        } else if (outputObj is ControlCommand) {
          if (outputObj.commandType == CommandType.beginTag) {
            inTag = true;
          } else if (outputObj.commandType == CommandType.endTag) {
            inTag = false;
          }
        }
      }

      _currentText = cleanOutputWhitespace(sb.toString());
      _outputStreamTextDirty = false;
    }
    return _currentText;
  }

  /// Clean whitespace from output.
  String cleanOutputWhitespace(String str) {
    final sb = StringBuffer();
    int currentWhitespaceStart = -1;
    int startOfLine = 0;

    for (int i = 0; i < str.length; i++) {
      final c = str[i];
      final isInlineWhitespace = c == ' ' || c == '\t';

      if (isInlineWhitespace && currentWhitespaceStart == -1) {
        currentWhitespaceStart = i;
      }

      if (!isInlineWhitespace) {
        if (c != '\n' && currentWhitespaceStart > 0 && currentWhitespaceStart != startOfLine) {
          sb.write(' ');
        }
        currentWhitespaceStart = -1;
      }

      if (c == '\n') startOfLine = i + 1;

      if (!isInlineWhitespace) sb.write(c);
    }

    return sb.toString();
  }

  /// Current tags.
  List<String>? get currentTags {
    if (_outputStreamTagsDirty) {
      _currentTags = [];
      bool inTag = false;
      final sb = StringBuffer();

      for (final outputObj in outputStream) {
        if (outputObj is ControlCommand) {
          if (outputObj.commandType == CommandType.beginTag) {
            if (inTag && sb.isNotEmpty) {
              _currentTags!.add(cleanOutputWhitespace(sb.toString()));
              sb.clear();
            }
            inTag = true;
          } else if (outputObj.commandType == CommandType.endTag) {
            if (sb.isNotEmpty) {
              _currentTags!.add(cleanOutputWhitespace(sb.toString()));
              sb.clear();
            }
            inTag = false;
          }
        } else if (inTag && outputObj is StringValue) {
          sb.write(outputObj.value);
        } else if (outputObj is Tag && outputObj.text.isNotEmpty) {
          _currentTags!.add(outputObj.text);
        }
      }

      if (sb.isNotEmpty) {
        _currentTags!.add(cleanOutputWhitespace(sb.toString()));
      }

      _outputStreamTagsDirty = false;
    }
    return _currentTags;
  }

  /// Current flow name.
  String get currentFlowName => _currentFlow.name;

  /// Whether current flow is the default.
  bool get currentFlowIsDefaultFlow => _currentFlow.name == kDefaultFlowName;

  /// Names of all alive flows.
  List<String>? get aliveFlowNames {
    if (_aliveFlowNamesDirty) {
      _aliveFlowNames = [];
      if (_namedFlows != null) {
        for (final flowName in _namedFlows!.keys) {
          if (flowName != kDefaultFlowName) {
            _aliveFlowNames!.add(flowName);
          }
        }
      }
      _aliveFlowNamesDirty = false;
    }
    return _aliveFlowNames;
  }

  /// Whether in expression evaluation mode.
  bool get inExpressionEvaluation => callStack.currentElement.inExpressionEvaluation;
  set inExpressionEvaluation(bool value) {
    callStack.currentElement.inExpressionEvaluation = value;
  }

  /// Go to start of story.
  void goToStart() {
    callStack.currentElement.currentPointer = Pointer.startOf(
      story?.mainContentContainer,
    );
  }

  /// Switch to a named flow.
  void switchFlowInternal(String? flowName) {
    if (flowName == null) {
      throw ArgumentError('Must pass a non-null string to Story.SwitchFlow');
    }

    _namedFlows ??= {kDefaultFlowName: _currentFlow};

    if (flowName == _currentFlow.name) return;

    Flow flow;
    if (_namedFlows!.containsKey(flowName)) {
      flow = _namedFlows![flowName]!;
    } else {
      flow = Flow(flowName, story);
      _namedFlows![flowName] = flow;
      _aliveFlowNamesDirty = true;
    }

    _currentFlow = flow;
    variablesState.callStack = _currentFlow.callStack;
    outputStreamDirty();
  }

  /// Switch to default flow.
  void switchToDefaultFlowInternal() {
    if (_namedFlows == null) return;
    switchFlowInternal(kDefaultFlowName);
  }

  /// Remove a flow.
  void removeFlowInternal(String? flowName) {
    if (flowName == null) {
      throw ArgumentError('Must pass a non-null string to Story.DestroyFlow');
    }
    if (flowName == kDefaultFlowName) {
      throw ArgumentError('Cannot destroy default flow');
    }

    if (_currentFlow.name == flowName) {
      switchToDefaultFlowInternal();
    }

    _namedFlows?.remove(flowName);
    _aliveFlowNamesDirty = true;
  }

  /// Copy state for background save.
  StoryState copyAndStartPatching(bool forBackgroundSave) {
    final copy = StoryState(story);
    copy._patch = StatePatch(_patch);

    copy._currentFlow.name = _currentFlow.name;
    copy._currentFlow.callStack = CallStack.from(_currentFlow.callStack);
    copy._currentFlow.outputStream.addAll(_currentFlow.outputStream);
    copy.outputStreamDirty();

    if (forBackgroundSave) {
      for (final choice in _currentFlow.currentChoices) {
        copy._currentFlow.currentChoices.add(choice.clone());
      }
    } else {
      copy._currentFlow.currentChoices.addAll(_currentFlow.currentChoices);
    }

    if (_namedFlows != null) {
      copy._namedFlows = Map.from(_namedFlows!);
      copy._aliveFlowNamesDirty = true;
      copy._namedFlows![_currentFlow.name] = copy._currentFlow;
    }

    if (hasError) {
      copy._currentErrors = List.from(_currentErrors ?? []);
    }
    if (hasWarning) {
      copy._currentWarnings = List.from(_currentWarnings ?? []);
    }

    copy.variablesState = variablesState;
    copy.variablesState.callStack = copy.callStack;
    copy.variablesState.patch = copy._patch;

    copy.evaluationStack.addAll(evaluationStack);

    if (!divertedPointer.isNull) {
      copy.divertedPointer = divertedPointer.copy();
    }

    copy.previousPointer = previousPointer.copy();
    copy._visitCounts.addAll(_visitCounts);
    copy._turnIndices.addAll(_turnIndices);
    copy.currentTurnIndex = currentTurnIndex;
    copy.storySeed = storySeed;
    copy.previousRandom = previousRandom;
    copy.didSafeExit = didSafeExit;

    return copy;
  }

  /// Restore state after patching.
  void restoreAfterPatch() {
    variablesState.callStack = callStack;
    variablesState.patch = _patch;
  }

  /// Apply any pending patch.
  void applyAnyPatch() {
    if (_patch == null) return;

    variablesState.applyPatch();

    for (final entry in _patch!.visitCounts.entries) {
      _applyCountChanges(entry.key, entry.value, true);
    }

    for (final entry in _patch!.turnIndices.entries) {
      _applyCountChanges(entry.key, entry.value, false);
    }

    _patch = null;
  }

  void _applyCountChanges(Container container, int newCount, bool isVisit) {
    final counts = isVisit ? _visitCounts : _turnIndices;
    counts[container.path.toString()] = newCount;
  }

  /// Write state to JSON.
  void writeJson(SimpleJsonWriter writer) {
    writer.writeObjectStart();

    writer.writePropertyStart('flows');
    writer.writeObjectStart();

    if (_namedFlows != null) {
      for (final entry in _namedFlows!.entries) {
        writer.writePropertyStart(entry.key);
        entry.value.writeJson(writer);
        writer.writePropertyEnd();
      }
    } else {
      writer.writePropertyStart(_currentFlow.name);
      _currentFlow.writeJson(writer);
      writer.writePropertyEnd();
    }

    writer.writeObjectEnd();
    writer.writePropertyEnd();

    writer.writeProperty('currentFlowName', _currentFlow.name);
    writer.writePropertyStart('variablesState');
    variablesState.writeJson(writer);
    writer.writePropertyEnd();

    // TODO: Write evalStack, visitCounts, turnIndices, etc.

    writer.writeIntProperty('turnIdx', currentTurnIndex);
    writer.writeIntProperty('storySeed', storySeed);
    writer.writeIntProperty('previousRandom', previousRandom);
    writer.writeIntProperty('inkSaveVersion', kInkSaveStateVersion);

    writer.writeObjectEnd();
  }

  /// Load state from JSON object.
  void loadJsonObj(Map<String, dynamic> jObject) {
    final jSaveVersion = jObject['inkSaveVersion'];
    if (jSaveVersion == null) {
      throw FormatException('ink save format incorrect, can\'t load.');
    }
    if ((jSaveVersion as int) < kMinCompatibleLoadVersion) {
      throw FormatException(
        'Ink save format isn\'t compatible with current version',
      );
    }

    // TODO: Load flows, variables, evaluation stack, etc.

    outputStreamDirty();
    _aliveFlowNamesDirty = true;

    currentTurnIndex = jObject['turnIdx'] as int? ?? 0;
    storySeed = jObject['storySeed'] as int? ?? 0;
    previousRandom = jObject['previousRandom'] as int? ?? 0;
  }

  /// Reset errors and warnings.
  void resetErrors() {
    _currentErrors = null;
    _currentWarnings = null;
  }

  /// Reset output stream.
  void resetOutput([List<InkObject>? objs]) {
    outputStream.clear();
    if (objs != null) {
      outputStream.addAll(objs);
    }
    outputStreamDirty();
  }

  /// Push to output stream.
  void pushToOutputStream(InkObject? obj) {
    if (obj is StringValue) {
      final listText = _trySplittingHeadTailWhitespace(obj);
      if (listText != null) {
        for (final textObj in listText) {
          _pushToOutputStreamIndividual(textObj);
        }
        outputStreamDirty();
        return;
      }
    }

    _pushToOutputStreamIndividual(obj);
    outputStreamDirty();
  }

  /// Pop from output stream.
  void popFromOutputStream(int count) {
    outputStream.removeRange(outputStream.length - count, outputStream.length);
    outputStreamDirty();
  }

  List<StringValue>? _trySplittingHeadTailWhitespace(StringValue single) {
    final str = single.value;
    if (str == null) return null;

    int headFirstNewlineIdx = -1;
    int headLastNewlineIdx = -1;
    for (int i = 0; i < str.length; i++) {
      final c = str[i];
      if (c == '\n') {
        if (headFirstNewlineIdx == -1) headFirstNewlineIdx = i;
        headLastNewlineIdx = i;
      } else if (c == ' ' || c == '\t') {
        continue;
      } else {
        break;
      }
    }

    int tailLastNewlineIdx = -1;
    int tailFirstNewlineIdx = -1;
    for (int i = str.length - 1; i >= 0; i--) {
      final c = str[i];
      if (c == '\n') {
        if (tailLastNewlineIdx == -1) tailLastNewlineIdx = i;
        tailFirstNewlineIdx = i;
      } else if (c == ' ' || c == '\t') {
        continue;
      } else {
        break;
      }
    }

    if (headFirstNewlineIdx == -1 && tailLastNewlineIdx == -1) return null;

    final listTexts = <StringValue>[];
    int innerStrStart = 0;
    int innerStrEnd = str.length;

    if (headFirstNewlineIdx != -1) {
      if (headFirstNewlineIdx > 0) {
        listTexts.add(StringValue(str.substring(0, headFirstNewlineIdx)));
      }
      listTexts.add(StringValue('\n'));
      innerStrStart = headLastNewlineIdx + 1;
    }

    if (tailLastNewlineIdx != -1) {
      innerStrEnd = tailFirstNewlineIdx;
    }

    if (innerStrEnd > innerStrStart) {
      listTexts.add(StringValue(str.substring(innerStrStart, innerStrEnd)));
    }

    if (tailLastNewlineIdx != -1 && tailFirstNewlineIdx > headLastNewlineIdx) {
      listTexts.add(StringValue('\n'));
      if (tailLastNewlineIdx < str.length - 1) {
        listTexts.add(StringValue(str.substring(tailLastNewlineIdx + 1)));
      }
    }

    return listTexts;
  }

  void _pushToOutputStreamIndividual(InkObject? obj) {
    if (obj == null) return;

    final glue = obj is Glue ? obj : null;
    final text = obj is StringValue ? obj : null;

    bool includeInOutput = true;

    if (glue != null) {
      trimNewlinesFromOutputStream();
      includeInOutput = true;
    } else if (text != null) {
      // Get function trim index from current call stack element
      int functionTrimIndex = -1;
      final currEl = callStack.currentElement;
      if (currEl.type == PushPopType.function) {
        functionTrimIndex = currEl.functionStartInOutputStream ?? -1;
      }

      // Search backward through output stream to find glue
      int glueTrimIndex = -1;
      for (int i = outputStream.length - 1; i >= 0; i--) {
        final o = outputStream[i];
        final c = o is ControlCommand ? o : null;
        final g = o is Glue ? o : null;

        if (g != null) {
          glueTrimIndex = i;
          break;
        } else if (c != null && c.commandType == CommandType.beginString) {
          // BeginString found - reset function trim index if it's within this string
          if (i >= functionTrimIndex) {
            functionTrimIndex = -1;
          }
          break;
        }
      }

      // Calculate the effective trim index
      int trimIndex = -1;
      if (glueTrimIndex != -1 && functionTrimIndex != -1) {
        trimIndex = glueTrimIndex < functionTrimIndex ? glueTrimIndex : functionTrimIndex;
      } else if (glueTrimIndex != -1) {
        trimIndex = glueTrimIndex;
      } else {
        trimIndex = functionTrimIndex;
      }

      // Apply trim logic based on text type
      if (trimIndex != -1) {
        if (text.isNewline) {
          // Suppress newlines when within glue/function zone
          includeInOutput = false;
        } else if (text.isNonWhitespace) {
          // Non-whitespace content - clean up glue and function markers
          if (glueTrimIndex > -1) {
            removeExistingGlue();
          }

          if (functionTrimIndex > -1) {
            // Reset function start for all function elements on the stack
            final callStackElements = callStack.elements;
            for (int i = callStackElements.length - 1; i >= 0; i--) {
              final el = callStackElements[i];
              if (el.type == PushPopType.function) {
                el.functionStartInOutputStream = -1;
              } else {
                break;
              }
            }
          }
        }
      } else if (text.isNewline) {
        // No trim zone - only suppress duplicate newlines or leading newlines
        if (outputStreamEndsInNewline || !outputStreamContainsContent) {
          includeInOutput = false;
        }
      }
    }

    if (includeInOutput) {
      outputStream.add(obj);
      outputStreamDirty();
    }
  }

  /// Trim newlines from output stream.
  void trimNewlinesFromOutputStream() {
    int removeWhitespaceFrom = -1;

    int i = outputStream.length - 1;
    while (i >= 0) {
      final obj = outputStream[i];

      if (obj is ControlCommand || (obj is StringValue && obj.isNonWhitespace)) {
        break;
      } else if (obj is StringValue && obj.isNewline) {
        removeWhitespaceFrom = i;
      }
      i--;
    }

    if (removeWhitespaceFrom >= 0) {
      i = removeWhitespaceFrom;
      while (i < outputStream.length) {
        if (outputStream[i] is StringValue) {
          outputStream.removeAt(i);
        } else {
          i++;
        }
      }
    }

    outputStreamDirty();
  }

  /// Remove existing glue from output.
  void removeExistingGlue() {
    for (int i = outputStream.length - 1; i >= 0; i--) {
      final c = outputStream[i];
      if (c is Glue) {
        outputStream.removeAt(i);
      } else if (c is ControlCommand) {
        break;
      }
    }
    outputStreamDirty();
  }

  /// Whether output ends in newline.
  bool get outputStreamEndsInNewline {
    if (outputStream.isNotEmpty) {
      for (int i = outputStream.length - 1; i >= 0; i--) {
        if (outputStream[i] is ControlCommand) break;
        final text = outputStream[i];
        if (text is StringValue) {
          if (text.isNewline) return true;
          if (text.isNonWhitespace) break;
        }
      }
    }
    return false;
  }

  /// Whether output contains content.
  bool get outputStreamContainsContent {
    for (final content in outputStream) {
      if (content is StringValue) return true;
    }
    return false;
  }

  /// Whether in string evaluation mode.
  bool get inStringEvaluation {
    for (int i = outputStream.length - 1; i >= 0; i--) {
      final cmd = outputStream[i];
      if (cmd is ControlCommand && cmd.commandType == CommandType.beginString) {
        return true;
      }
    }
    return false;
  }

  /// Push to evaluation stack.
  void pushEvaluationStack(InkObject? obj) {
    if (obj == null) return;

    if (obj is ListValue) {
      // TODO: Update list origins
    }

    evaluationStack.add(obj);
  }

  /// Pop from evaluation stack.
  InkObject? popEvaluationStack() {
    if (evaluationStack.isEmpty) return null;
    return evaluationStack.removeLast();
  }

  /// Pop multiple from evaluation stack.
  List<InkObject> popEvaluationStackMultiple(int numberOfObjects) {
    if (numberOfObjects > evaluationStack.length) {
      throw StateError('Trying to pop too many objects');
    }

    final popped = evaluationStack.sublist(
      evaluationStack.length - numberOfObjects,
    );
    evaluationStack.removeRange(
      evaluationStack.length - numberOfObjects,
      evaluationStack.length,
    );
    return popped;
  }

  /// Peek evaluation stack.
  InkObject? peekEvaluationStack() {
    if (evaluationStack.isEmpty) return null;
    return evaluationStack.last;
  }

  /// Force end of story.
  void forceEnd() {
    callStack.reset();
    _currentFlow.currentChoices.clear();
    currentPointer = Pointer.null_();
    previousPointer = Pointer.null_();
    didSafeExit = true;
  }

  /// Pop from call stack.
  void popCallStack([PushPopType? popType]) {
    if (callStack.currentElement.type == PushPopType.function) {
      trimWhitespaceFromFunctionEnd();
    }
    callStack.pop(popType);
  }

  /// Trim whitespace from function end.
  void trimWhitespaceFromFunctionEnd() {
    int functionStartPoint = callStack.currentElement.functionStartInOutputStream ?? 0;

    for (int i = outputStream.length - 1; i >= functionStartPoint; i--) {
      final obj = outputStream[i];
      if (obj is! StringValue) continue;
      if (obj is ControlCommand) break;

      if (obj.isNewline || obj.isInlineWhitespace) {
        outputStream.removeAt(i);
        outputStreamDirty();
      } else {
        break;
      }
    }
  }

  /// Set chosen path.
  void setChosenPath(dynamic path, bool incrementingTurnIndex) {
    // Changing direction, assume we need to clear current set of choices
    _currentFlow.currentChoices.clear();

    // Resolve path to pointer
    var newPointer = story.pointerAtPath(path as Path);
    if (!newPointer.isNull && newPointer.index == -1) {
      newPointer.index = 0;
    }

    currentPointer = newPointer;

    if (incrementingTurnIndex) {
      currentTurnIndex++;
    }
  }

  /// Add an error or warning.
  void addError(String message, bool isWarning) {
    if (!isWarning) {
      _currentErrors ??= [];
      _currentErrors!.add(message);
    } else {
      _currentWarnings ??= [];
      _currentWarnings!.add(message);
    }
  }

  /// Mark output stream as dirty.
  void outputStreamDirty() {
    _outputStreamTextDirty = true;
    _outputStreamTagsDirty = true;
  }
}
