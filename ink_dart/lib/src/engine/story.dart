import 'ink_object.dart';
import 'container.dart';
import 'story_state.dart';
import 'choice.dart';
import 'path.dart';
import 'pointer.dart';
import 'value.dart';
import 'control_command.dart';
import 'divert.dart';
import 'choice_point.dart';
import 'variable_reference.dart';
import 'variable_assignment.dart';
import 'native_function_call.dart';
import 'void.dart' as void_module;
import 'list_definition.dart';
import 'list_definitions_origin.dart';
import 'json_serialisation.dart';
import 'simple_json.dart';
import 'story_exception.dart';
import 'prng.dart';
import 'ink_list.dart';
import 'tag.dart';
import 'glue.dart';
import 'call_stack.dart';

typedef Void = void_module.Void;

/// Error types for story errors.
enum ErrorType { error, warning }

/// Error handler callback type.
typedef ErrorHandler = void Function(String message, ErrorType type);

/// Variable observer callback type.
typedef VariableObserver = void Function(String variableName, dynamic newValue);

/// External function callback type.
typedef ExternalFunction = dynamic Function(List<dynamic> args);

/// The main Story class for running Ink narratives.
///
/// This is the primary entry point for:
/// - Loading compiled Ink JSON
/// - Continuing story text
/// - Presenting choices
/// - Accessing story state for save/load
class Story extends InkObject {
  /// Current Ink format version.
  static const int inkVersionCurrent = 21;

  /// Minimum compatible version for loading.
  static const int inkVersionMinimumCompatible = 18;

  Container? _mainContentContainer;
  ListDefinitionsOrigin? _listDefinitions;
  StoryState? _state;

  final Map<String, _ExternalFunctionDef> _externals = {};
  Map<String, List<VariableObserver>>? _variableObservers;
  bool _hasValidatedExternals = false;

  Container? _temporaryEvaluationContainer;

  bool _asyncContinueActive = false;
  StoryState? _stateSnapshotAtLastNewline;
  bool _sawLookaheadUnsafeFunctionAfterNewline = false;

  int _recursiveContinueCount = 0;
  bool _asyncSaving = false;

  /// Error handler callback.
  ErrorHandler? onError;

  /// Called after Continue() completes.
  void Function()? onDidContinue;

  /// Called when a choice is made.
  void Function(Choice)? onMakeChoice;

  /// Called when evaluating a function.
  void Function(String, List<dynamic>)? onEvaluateFunction;

  /// Called after function evaluation.
  void Function(String, List<dynamic>, String, dynamic)? onCompleteEvaluateFunction;

  /// Called when choosing a path string.
  void Function(String, List<dynamic>)? onChoosePathString;

  /// Allow falling back to ink functions for unbound externals.
  bool allowExternalFunctionFallbacks = false;

  /// Create a Story from a Container (for compiler use).
  Story.fromContainer(Container contentContainer, [List<ListDefinition>? lists])
      : _mainContentContainer = contentContainer {
    if (lists != null) {
      _listDefinitions = ListDefinitionsOrigin(lists);
    }
  }

  /// Create a Story from JSON string.
  Story(String jsonString) {
    final json = SimpleJson.textToDictionary(jsonString);
    _initFromJson(json);
  }

  /// Create a Story from parsed JSON object.
  Story.fromJson(Map<String, dynamic> json) {
    _initFromJson(json);
  }

  void _initFromJson(Map<String, dynamic> json) {
    final versionObj = json['inkVersion'];
    if (versionObj == null) {
      throw StoryException(
        "ink version number not found. Are you sure it's a valid .ink.json file?",
      );
    }

    final formatFromFile = versionObj as int;
    if (formatFromFile > inkVersionCurrent) {
      throw StoryException(
        'Version of ink used to build story was newer than the current version of the engine',
      );
    } else if (formatFromFile < inkVersionMinimumCompatible) {
      throw StoryException(
        'Version of ink used to build story is too old to be loaded by this version of the engine',
      );
    }

    final rootToken = json['root'];
    if (rootToken == null) {
      throw StoryException(
        "Root node for ink not found. Are you sure it's a valid .ink.json file?",
      );
    }

    if (json.containsKey('listDefs')) {
      _listDefinitions = JsonSerialisation.jTokenToListDefinitions(
        json['listDefs'] as Map<String, dynamic>,
      );
    }

    _mainContentContainer =
        JsonSerialisation.jTokenToRuntimeObject(rootToken) as Container?;

    resetState();
  }

  /// Current available choices.
  List<Choice> get currentChoices {
    final choices = <Choice>[];
    if (_state == null) return choices;

    for (final c in _state!.currentChoices) {
      if (!c.isInvisibleDefault) {
        c.index = choices.length;
        choices.push(c);
      }
    }
    return choices;
  }

  /// Current story text.
  String? get currentText {
    _ifAsyncWeCant("call currentText since it's a work in progress");
    return state.currentText;
  }

  /// Current tags.
  List<String>? get currentTags {
    _ifAsyncWeCant("call currentTags since it's a work in progress");
    return state.currentTags;
  }

  /// Current errors.
  List<String>? get currentErrors => state.currentErrors;

  /// Current warnings.
  List<String>? get currentWarnings => state.currentWarnings;

  /// Current flow name.
  String get currentFlowName => state.currentFlowName;

  /// Whether current flow is the default.
  bool get currentFlowIsDefaultFlow => state.currentFlowIsDefaultFlow;

  /// Names of all alive flows.
  List<String>? get aliveFlowNames => state.aliveFlowNames;

  /// Whether there are errors.
  bool get hasError => state.hasError;

  /// Whether there are warnings.
  bool get hasWarning => state.hasWarning;

  /// Variables state accessor.
  dynamic get variablesState => state.variablesState;

  /// List definitions.
  ListDefinitionsOrigin? get listDefinitions => _listDefinitions;

  /// Story state.
  StoryState get state => _state!;

  /// Main content container.
  Container get mainContentContainer =>
      _temporaryEvaluationContainer ?? _mainContentContainer!;

  /// Whether we can continue.
  bool get canContinue => state.canContinue;

  /// Whether async continue is complete.
  bool get asyncContinueComplete => !_asyncContinueActive;

  /// Serialize story to JSON.
  String toJson([SimpleJsonWriter? writer]) {
    final shouldReturn = writer == null;
    writer ??= SimpleJsonWriter();

    writer.writeObjectStart();
    writer.writeIntProperty('inkVersion', inkVersionCurrent);

    writer.writePropertyStart('root');
    JsonSerialisation.writeRuntimeContainer(writer, _mainContentContainer);
    writer.writePropertyEnd();

    if (_listDefinitions != null) {
      writer.writePropertyStart('listDefs');
      writer.writeObjectStart();

      for (final def in _listDefinitions!.lists) {
        writer.writePropertyStart(def.name);
        writer.writeObjectStart();

        for (final item in def.items.entries) {
          final inkItem = InkListItem.fromSerializedKey(item.key);
          writer.writeIntProperty(inkItem.itemName ?? '', item.value);
        }

        writer.writeObjectEnd();
        writer.writePropertyEnd();
      }

      writer.writeObjectEnd();
      writer.writePropertyEnd();
    }

    writer.writeObjectEnd();

    return shouldReturn ? writer.toString() : '';
  }

  /// Reset story state.
  void resetState() {
    _ifAsyncWeCant('ResetState');

    _state = StoryState(this);
    _state!.variablesState.observeVariableChange(_variableStateDidChangeEvent);

    resetGlobals();
  }

  /// Reset errors.
  void resetErrors() {
    _state?.resetErrors();
  }

  /// Reset callstack.
  void resetCallstack() {
    _ifAsyncWeCant('ResetCallstack');
    _state?.forceEnd();
  }

  /// Reset global variables.
  void resetGlobals() {
    if (_mainContentContainer!.namedContent.containsKey('global decl')) {
      final originalPointer = state.currentPointer.copy();

      choosePath(Path.fromString('global decl'), false);
      _continueInternal();

      state.currentPointer = originalPointer;
    }

    state.variablesState.snapshotDefaultGlobals();
  }

  /// Switch to a named flow.
  void switchFlow(String flowName) {
    _ifAsyncWeCant('switch flow');
    if (_asyncSaving) {
      throw StoryException(
        "Story is already in background saving mode, can't switch flow to $flowName",
      );
    }
    state.switchFlowInternal(flowName);
  }

  /// Remove a flow.
  void removeFlow(String flowName) {
    state.removeFlowInternal(flowName);
  }

  /// Switch to default flow.
  void switchToDefaultFlow() {
    state.switchToDefaultFlowInternal();
  }

  /// Continue the story.
  String? continueStory() {
    continueAsync(0);
    return currentText;
  }

  /// Continue story asynchronously.
  void continueAsync(int millisecsLimitAsync) {
    if (!_hasValidatedExternals) {
      validateExternalBindings();
    }
    _continueInternal(millisecsLimitAsync);
  }

  void _continueInternal([int millisecsLimitAsync = 0]) {
    final isAsyncTimeLimited = millisecsLimitAsync > 0;
    _recursiveContinueCount++;

    if (!_asyncContinueActive) {
      _asyncContinueActive = isAsyncTimeLimited;

      if (!canContinue) {
        throw StoryException(
          "Can't continue - should check canContinue before calling Continue",
        );
      }

      _state!.didSafeExit = false;
      _state!.resetOutput();

      if (_recursiveContinueCount == 1) {
        _state!.variablesState.startVariableObservation();
      }
    } else if (_asyncContinueActive && !isAsyncTimeLimited) {
      _asyncContinueActive = false;
    }

    final durationStopwatch = Stopwatch()..start();

    bool outputStreamEndsInNewline = false;
    _sawLookaheadUnsafeFunctionAfterNewline = false;

    do {
      try {
        outputStreamEndsInNewline = _continueSingleStep();
      } on StoryException catch (e) {
        addError(e.message, useEndLineNumber: e.useEndLineNumber);
        break;
      }

      if (outputStreamEndsInNewline) break;

      if (_asyncContinueActive &&
          durationStopwatch.elapsedMilliseconds > millisecsLimitAsync) {
        break;
      }
    } while (canContinue);

    durationStopwatch.stop();

    Map<String, dynamic>? changedVariablesToObserve;

    if (outputStreamEndsInNewline || !canContinue) {
      if (_stateSnapshotAtLastNewline != null) {
        _restoreStateSnapshot();
      }

      if (!canContinue) {
        if (state.callStack.canPopThread) {
          addError(
            'Thread available to pop, threads should always be flat by the end of evaluation?',
          );
        }

        if (state.generatedChoices.isEmpty &&
            !state.didSafeExit &&
            _temporaryEvaluationContainer == null) {
          if (state.callStack.canPop(PushPopType.tunnel)) {
            addError(
              "unexpectedly reached end of content. Do you need a '->->' to return from a tunnel?",
            );
          } else if (state.callStack.canPop(PushPopType.function)) {
            addError(
              "unexpectedly reached end of content. Do you need a '~ return'?",
            );
          } else if (!state.callStack.canPop()) {
            addError("ran out of content. Do you need a '-> DONE' or '-> END'?");
          } else {
            addError(
              'unexpectedly reached end of content for unknown reason. Please debug compiler!',
            );
          }
        }
      }

      state.didSafeExit = false;
      _sawLookaheadUnsafeFunctionAfterNewline = false;

      if (_recursiveContinueCount == 1) {
        changedVariablesToObserve =
            _state!.variablesState.completeVariableObservation();
      }

      _asyncContinueActive = false;
      onDidContinue?.call();
    }

    _recursiveContinueCount--;

    if (state.hasError || state.hasWarning) {
      if (onError != null) {
        if (state.hasError) {
          for (final err in state.currentErrors!) {
            onError!(err, ErrorType.error);
          }
        }
        if (state.hasWarning) {
          for (final err in state.currentWarnings!) {
            onError!(err, ErrorType.warning);
          }
        }
        resetErrors();
      } else {
        final sb = StringBuffer('Ink had ');
        if (state.hasError) {
          sb.write('${state.currentErrors!.length} ');
          sb.write(state.currentErrors!.length == 1 ? 'error' : 'errors');
          if (state.hasWarning) sb.write(' and ');
        }
        if (state.hasWarning) {
          sb.write('${state.currentWarnings!.length} ');
          sb.write(state.currentWarnings!.length == 1 ? 'warning' : 'warnings');
        }
        sb.write('. It is strongly suggested that you assign an error handler to story.onError.');
        sb.write(' The first issue was: ');
        sb.write(
          state.hasError ? state.currentErrors![0] : state.currentWarnings![0],
        );
        throw StoryException(sb.toString());
      }
    }

    if (changedVariablesToObserve != null &&
        changedVariablesToObserve.isNotEmpty) {
      _state!.variablesState.notifyObservers(changedVariablesToObserve);
    }
  }

  bool _continueSingleStep() {
    step();

    if (!canContinue && !state.callStack.elementIsEvaluateFromGame) {
      _tryFollowDefaultInvisibleChoice();
    }

    if (!state.inStringEvaluation) {
      if (_stateSnapshotAtLastNewline != null) {
        final change = _calculateNewlineOutputStateChange(
          _stateSnapshotAtLastNewline!.currentText,
          state.currentText,
          _stateSnapshotAtLastNewline!.currentTags?.length ?? 0,
          state.currentTags?.length ?? 0,
        );

        if (change == OutputStateChange.extendedBeyondNewline ||
            _sawLookaheadUnsafeFunctionAfterNewline) {
          _restoreStateSnapshot();
          return true;
        } else if (change == OutputStateChange.newlineRemoved) {
          _discardSnapshot();
        }
      }

      if (state.outputStreamEndsInNewline) {
        if (canContinue) {
          if (_stateSnapshotAtLastNewline == null) {
            _stateSnapshot();
          }
        } else {
          _discardSnapshot();
        }
      }
    }

    return false;
  }

  OutputStateChange _calculateNewlineOutputStateChange(
    String? prevText,
    String? currText,
    int prevTagCount,
    int currTagCount,
  ) {
    if (prevText == null || currText == null) {
      return OutputStateChange.noChange;
    }

    final newlineStillExists = currText.length >= prevText.length &&
        prevText.isNotEmpty &&
        currText[prevText.length - 1] == '\n';

    if (prevTagCount == currTagCount &&
        prevText.length == currText.length &&
        newlineStillExists) {
      return OutputStateChange.noChange;
    }

    if (!newlineStillExists) {
      return OutputStateChange.newlineRemoved;
    }

    if (currTagCount > prevTagCount) {
      return OutputStateChange.extendedBeyondNewline;
    }

    for (int i = prevText.length; i < currText.length; i++) {
      final c = currText[i];
      if (c != ' ' && c != '\t') {
        return OutputStateChange.extendedBeyondNewline;
      }
    }

    return OutputStateChange.noChange;
  }

  /// Continue maximally.
  String continueMaximally() {
    _ifAsyncWeCant('ContinueMaximally');

    final sb = StringBuffer();
    while (canContinue) {
      sb.write(continueStory());
    }
    return sb.toString();
  }

  /// Get content at path.
  SearchResult contentAtPath(Path path) {
    return mainContentContainer.contentAtPath(path);
  }

  /// Get knot container by name.
  Container? knotContainerWithName(String name) {
    final namedContainer = mainContentContainer.namedContent[name];
    if (namedContainer is Container) return namedContainer;
    return null;
  }

  /// Get pointer at path.
  Pointer pointerAtPath(Path path) {
    if (path.length == 0) return Pointer.null_();

    int pathLengthToUse = path.length;
    Container? container;
    int index;

    SearchResult? result;

    // Handle relative paths by resolving from current position
    if (path.isRelative) {
      // Get the actual element at current position to resolve relative paths
      final currentElement = state.currentPointer.resolve();
      if (currentElement != null) {
        result = currentElement.resolvePath(path);
        container = result.obj is Container ? result.obj as Container : null;
        index = -1;

        // If result is a container, get proper pointer
        if (result.obj != null) {
          if (path.lastComponent?.isIndex == true) {
            container = result.obj is Container ? result.obj as Container : null;
            index = path.lastComponent!.index;
          } else if (result.obj is Container) {
            container = result.obj as Container;
            index = -1;
          }
        }
      } else {
        // No current element, try from root
        result = mainContentContainer.contentAtPath(path);
        container = result.container as Container?;
        index = -1;
      }
    } else if (path.lastComponent?.isIndex == true) {
      pathLengthToUse = path.length - 1;
      result = mainContentContainer.contentAtPath(path, partialPathLength: pathLengthToUse);
      container = result.container as Container?;
      index = path.lastComponent!.index;
    } else {
      result = mainContentContainer.contentAtPath(path);
      container = result.container as Container?;
      index = -1;
    }

    final p = Pointer(container, index);

    if (result == null || result.obj == null ||
        (result.obj == mainContentContainer && pathLengthToUse > 0)) {
      error(
        "Failed to find content at path '$path', and no approximation of it was possible.",
      );
    } else if (result.approximate) {
      warning(
        "Failed to find content at path '$path', so it was approximated to: '${result.obj!.path}'.",
      );
    }

    return p;
  }

  void _stateSnapshot() {
    _stateSnapshotAtLastNewline = _state;
    _state = _state!.copyAndStartPatching(false);
  }

  void _restoreStateSnapshot() {
    _stateSnapshotAtLastNewline!.restoreAfterPatch();
    _state = _stateSnapshotAtLastNewline;
    _stateSnapshotAtLastNewline = null;

    if (!_asyncSaving) {
      _state!.applyAnyPatch();
    }
  }

  void _discardSnapshot() {
    if (!_asyncSaving) {
      _state!.applyAnyPatch();
    }
    _stateSnapshotAtLastNewline = null;
  }

  /// Execute a single step.
  void step() {
    bool shouldAddToStream = true;

    var pointer = state.currentPointer.copy();
    if (pointer.isNull) return;

    final resolved = pointer.resolve();
    Container? containerToEnter = resolved is Container ? resolved : null;

    while (containerToEnter != null) {
      _visitContainer(containerToEnter, true);

      if (containerToEnter.content.isEmpty) break;

      pointer = Pointer.startOf(containerToEnter);
      final newResolved = pointer.resolve();
      containerToEnter = newResolved is Container ? newResolved : null;
    }

    state.currentPointer = pointer.copy();

    final currentContentObj = pointer.resolve();
    final isLogicOrFlowControl = performLogicAndFlowControl(currentContentObj);

    if (state.currentPointer.isNull) return;

    if (isLogicOrFlowControl) {
      shouldAddToStream = false;
    }

    // Choice with condition?
    if (currentContentObj is ChoicePoint) {
      final choice = _processChoice(currentContentObj);
      if (choice != null) {
        state.generatedChoices.add(choice);
      }
      shouldAddToStream = false;
    }

    if (currentContentObj is Container) {
      shouldAddToStream = false;
    }

    if (shouldAddToStream) {
      var contentToAdd = currentContentObj;

      if (contentToAdd is VariablePointerValue && contentToAdd.contextIndex == -1) {
        final contextIdx = state.callStack.contextForVariableNamed(
          contentToAdd.variableName!,
        );
        contentToAdd = VariablePointerValue(contentToAdd.variableName, contextIdx);
      }

      if (state.inExpressionEvaluation) {
        state.pushEvaluationStack(contentToAdd);
      } else {
        state.pushToOutputStream(contentToAdd);
      }
    }

    _nextContent();

    if (currentContentObj is ControlCommand &&
        currentContentObj.commandType == CommandType.startThread) {
      state.callStack.pushThread();
    }
  }

  void _visitContainer(Container container, bool atStart) {
    if (!container.countingAtStartOnly || atStart) {
      if (container.visitsShouldBeCounted) {
        state.incrementVisitCountForContainer(container);
      }
      if (container.turnIndexShouldBeCounted) {
        state.recordTurnIndexVisitToContainer(container);
      }
    }
  }

  Choice? _processChoice(ChoicePoint choicePoint) {
    bool showChoice = true;

    if (choicePoint.hasCondition) {
      final conditionValue = state.popEvaluationStack();
      if (!_isTruthy(conditionValue)) {
        showChoice = false;
      }
    }

    String startText = '';
    String choiceOnlyText = '';
    final tags = <String>[];

    if (choicePoint.hasChoiceOnlyContent) {
      choiceOnlyText = _popChoiceStringAndTags(tags) ?? '';
    }

    if (choicePoint.hasStartContent) {
      startText = _popChoiceStringAndTags(tags) ?? '';
    }

    if (choicePoint.onceOnly) {
      final visitCount = state.visitCountForContainer(choicePoint.choiceTarget);
      if (visitCount > 0) {
        showChoice = false;
      }
    }

    if (!showChoice) return null;

    final choice = Choice();
    choice.targetPath = choicePoint.pathOnChoice;
    choice.sourcePath = choicePoint.path.toString();
    choice.isInvisibleDefault = choicePoint.isInvisibleDefault;
    choice.threadAtGeneration = state.callStack.forkThread();
    choice.tags = tags.reversed.toList();
    choice.text = (startText + choiceOnlyText).trim();

    return choice;
  }

  String? _popChoiceStringAndTags(List<String> tags) {
    final choiceOnlyStrVal = state.popEvaluationStack() as StringValue?;

    while (state.evaluationStack.isNotEmpty &&
        state.peekEvaluationStack() is Tag) {
      final tag = state.popEvaluationStack() as Tag;
      tags.add(tag.text);
    }

    return choiceOnlyStrVal?.value;
  }

  bool _isTruthy(InkObject? obj) {
    if (obj is Value) {
      if (obj is DivertTargetValue) {
        error(
          "Shouldn't use a divert target (to ${obj.targetPath}) as a conditional value.",
        );
        return false;
      }
      return obj.isTruthy;
    }
    return false;
  }

  /// Perform logic and flow control.
  bool performLogicAndFlowControl(InkObject? contentObj) {
    if (contentObj == null) return false;

    // Divert
    if (contentObj is Divert) {
      final currentDivert = contentObj;

      if (currentDivert.isConditional) {
        final conditionValue = state.popEvaluationStack();
        if (!_isTruthy(conditionValue)) return true;
      }

      if (currentDivert.hasVariableTarget) {
        final varName = currentDivert.variableDivertName;
        final varContents = state.variablesState.getVariableWithName(varName);

        if (varContents == null) {
          error("Tried to divert using a target from a variable that could not be found ($varName)");
        } else if (varContents is! DivertTargetValue) {
          error("Tried to divert to a target from a variable, but the variable ($varName) didn't contain a divert target");
        }

        if (varContents is DivertTargetValue) {
          state.divertedPointer = pointerAtPath(varContents.targetPath!);
        }
      } else if (currentDivert.isExternal) {
        _callExternalFunction(
          currentDivert.targetPathString,
          currentDivert.externalArgs,
        );
        return true;
      } else {
        state.divertedPointer = currentDivert.targetPointer.copy();
      }

      if (currentDivert.pushesToStack && currentDivert.stackPushType != null) {
        state.callStack.push(
          currentDivert.stackPushType!,
          outputStreamLengthWithPushed: state.outputStream.length,
        );
      }

      if (state.divertedPointer.isNull && !currentDivert.isExternal) {
        error('Divert resolution failed: $currentDivert');
      }

      return true;
    }

    // Control command
    if (contentObj is ControlCommand) {
      return _performControlCommand(contentObj);
    }

    // Variable assignment
    if (contentObj is VariableAssignment) {
      final assignedVal = state.popEvaluationStack();
      if (assignedVal != null) {
        state.variablesState.assign(contentObj, assignedVal);
      }
      return true;
    }

    // Variable reference
    if (contentObj is VariableReference) {
      InkObject? foundValue;

      if (contentObj.pathForCount != null) {
        final container = contentObj.containerForCount;
        final count = state.visitCountForContainer(container);
        foundValue = IntValue(count);
      } else {
        foundValue = state.variablesState.getVariableWithName(contentObj.name);

        if (foundValue == null) {
          warning(
            "Variable not found: '${contentObj.name}'. Using default value of 0 (false).",
          );
          foundValue = IntValue(0);
        }
      }

      state.pushEvaluationStack(foundValue);
      return true;
    }

    // Native function call
    if (contentObj is NativeFunctionCall) {
      final funcParams = state.popEvaluationStackMultiple(
        contentObj.numberOfParameters,
      );
      final result = contentObj.call(funcParams);
      state.pushEvaluationStack(result);
      return true;
    }

    return false;
  }

  bool _performControlCommand(ControlCommand evalCommand) {
    switch (evalCommand.commandType) {
      case CommandType.evalStart:
        assert(!state.inExpressionEvaluation, 'Already in expression evaluation?');
        state.inExpressionEvaluation = true;
        break;

      case CommandType.evalEnd:
        assert(state.inExpressionEvaluation, 'Not in expression evaluation mode');
        state.inExpressionEvaluation = false;
        break;

      case CommandType.evalOutput:
        if (state.evaluationStack.isNotEmpty) {
          final output = state.popEvaluationStack();
          if (output is! Void) {
            final text = StringValue(output.toString());
            state.pushToOutputStream(text);
          }
        }
        break;

      case CommandType.noOp:
        break;

      case CommandType.duplicate:
        state.pushEvaluationStack(state.peekEvaluationStack());
        break;

      case CommandType.popEvaluatedValue:
        state.popEvaluationStack();
        break;

      case CommandType.popFunction:
      case CommandType.popTunnel:
        final popType = evalCommand.commandType == CommandType.popFunction
            ? PushPopType.function
            : PushPopType.tunnel;

        DivertTargetValue? overrideTunnelReturnTarget;
        if (popType == PushPopType.tunnel) {
          final popped = state.popEvaluationStack();
          // Use type check instead of cast - popped may be Void or DivertTargetValue
          overrideTunnelReturnTarget = popped is DivertTargetValue ? popped : null;
          if (overrideTunnelReturnTarget == null && popped != null) {
            assert(popped is Void, "Expected void if ->-> doesn't override target");
          }
        }

        if (state.callStack.currentElement.type != popType ||
            !state.callStack.canPop()) {
          final names = {
            PushPopType.function: 'function return statement (~ return)',
            PushPopType.tunnel: 'tunnel onwards statement (->->)',
          };
          final expected = !state.callStack.canPop()
              ? 'end of flow (-> END or choice)'
              : names[state.callStack.currentElement.type];
          error('Found ${names[popType]}, when expected $expected');
        } else {
          state.popCallStack();
          if (overrideTunnelReturnTarget != null) {
            state.divertedPointer = pointerAtPath(
              overrideTunnelReturnTarget.targetPath!,
            );
          }
        }
        break;

      case CommandType.beginString:
        state.pushToOutputStream(evalCommand);
        assert(state.inExpressionEvaluation, 'Expected to be in an expression when evaluating a string');
        state.inExpressionEvaluation = false;
        break;

      case CommandType.beginTag:
        state.pushToOutputStream(evalCommand);
        break;

      case CommandType.endTag:
        if (state.inStringEvaluation) {
          final contentStackForTag = <InkObject>[];
          int outputCountConsumed = 0;

          for (int i = state.outputStream.length - 1; i >= 0; i--) {
            final obj = state.outputStream[i];
            outputCountConsumed++;

            if (obj is ControlCommand) {
              if (obj.commandType == CommandType.beginTag) {
                break;
              } else {
                error('Unexpected ControlCommand while extracting tag from choice');
                break;
              }
            }
            if (obj is StringValue) {
              contentStackForTag.add(obj);
            }
          }

          state.popFromOutputStream(outputCountConsumed);

          final sb = StringBuffer();
          for (final strVal in contentStackForTag.reversed) {
            sb.write(strVal.toString());
          }

          final choiceTag = Tag(state.cleanOutputWhitespace(sb.toString()));
          state.pushEvaluationStack(choiceTag);
        } else {
          state.pushToOutputStream(evalCommand);
        }
        break;

      case CommandType.endString:
        final contentStackForString = <InkObject>[];
        final contentToRetain = <InkObject>[];

        int outputCountConsumed = 0;
        for (int i = state.outputStream.length - 1; i >= 0; i--) {
          final obj = state.outputStream[i];
          outputCountConsumed++;

          if (obj is ControlCommand &&
              obj.commandType == CommandType.beginString) {
            break;
          }
          if (obj is Tag) {
            contentToRetain.add(obj);
          }
          if (obj is StringValue) {
            contentStackForString.add(obj);
          }
        }

        state.popFromOutputStream(outputCountConsumed);

        for (final rescuedTag in contentToRetain) {
          state.pushToOutputStream(rescuedTag);
        }

        final sb = StringBuffer();
        for (final c in contentStackForString.reversed) {
          sb.write(c.toString());
        }

        state.inExpressionEvaluation = true;
        state.pushEvaluationStack(StringValue(sb.toString()));
        break;

      case CommandType.choiceCount:
        final choiceCount = state.generatedChoices.length;
        state.pushEvaluationStack(IntValue(choiceCount));
        break;

      case CommandType.turns:
        state.pushEvaluationStack(IntValue(state.currentTurnIndex + 1));
        break;

      case CommandType.turnsSince:
      case CommandType.readCount:
        final target = state.popEvaluationStack();
        if (target is! DivertTargetValue) {
          error('TURNS_SINCE / READ_COUNT expected a divert target');
          break;
        }

        final container = contentAtPath(target.targetPath!).correctObj as Container?;

        int eitherCount;
        if (container != null) {
          if (evalCommand.commandType == CommandType.turnsSince) {
            eitherCount = state.turnsSinceForContainer(container);
          } else {
            eitherCount = state.visitCountForContainer(container);
          }
        } else {
          eitherCount = evalCommand.commandType == CommandType.turnsSince ? -1 : 0;
          warning('Failed to find container for $evalCommand lookup at ${target.targetPath}');
        }

        state.pushEvaluationStack(IntValue(eitherCount));
        break;

      case CommandType.random:
        final maxInt = state.popEvaluationStack() as IntValue?;
        final minInt = state.popEvaluationStack() as IntValue?;

        if (minInt == null || maxInt == null) {
          error('Invalid value for parameter of RANDOM(min, max)');
          break;
        }

        final randomRange = maxInt.value! - minInt.value! + 1;
        if (randomRange <= 0) {
          error('RANDOM was called with minimum as ${minInt.value} and maximum as ${maxInt.value}. The maximum must be larger');
          break;
        }

        final resultSeed = state.storySeed + state.previousRandom;
        final random = PRNG(resultSeed);

        final nextRandom = random.next();
        final chosenValue = (nextRandom % randomRange) + minInt.value!;
        state.pushEvaluationStack(IntValue(chosenValue));

        state.previousRandom = nextRandom;
        break;

      case CommandType.seedRandom:
        final seed = state.popEvaluationStack() as IntValue?;
        if (seed == null) {
          error('Invalid value passed to SEED_RANDOM');
          break;
        }
        state.storySeed = seed.value!;
        state.previousRandom = 0;
        state.pushEvaluationStack(Void());
        break;

      case CommandType.visitIndex:
        final count = state.visitCountForContainer(
          state.currentPointer.container,
        ) - 1;
        state.pushEvaluationStack(IntValue(count));
        break;

      case CommandType.sequenceShuffleIndex:
        final shuffleIndex = _nextSequenceShuffleIndex();
        state.pushEvaluationStack(IntValue(shuffleIndex));
        break;

      case CommandType.startThread:
        // Handled in step()
        break;

      case CommandType.done:
        if (state.callStack.canPopThread) {
          state.callStack.popThread();
        } else {
          state.didSafeExit = true;
          state.currentPointer = Pointer.null_();
        }
        break;

      case CommandType.end:
        state.forceEnd();
        break;

      case CommandType.listFromInt:
        final intVal = state.popEvaluationStack() as IntValue?;
        final listNameVal = state.popEvaluationStack() as StringValue?;

        if (intVal == null) {
          throw StoryException('Passed non-integer when creating a list element from a numerical value.');
        }

        ListValue? generatedListValue;
        if (_listDefinitions != null && listNameVal != null) {
          final foundListDef = _listDefinitions!.tryListGetDefinition(
            listNameVal.value,
            null,
          );
          if (foundListDef.exists && foundListDef.result != null) {
            final foundItem = foundListDef.result!.tryGetItemWithValue(
              intVal.value!,
              InkListItem.null_(),
            );
            if (foundItem.exists && foundItem.result != null) {
              generatedListValue = ListValue.fromItem(
                foundItem.result!,
                intVal.value!,
              );
            }
          } else {
            throw StoryException('Failed to find LIST called ${listNameVal.value}');
          }
        }

        generatedListValue ??= ListValue();
        state.pushEvaluationStack(generatedListValue);
        break;

      case CommandType.listRange:
        final max = state.popEvaluationStack() as Value?;
        final min = state.popEvaluationStack() as Value?;
        final targetList = state.popEvaluationStack() as ListValue?;

        if (targetList == null || min == null || max == null) {
          throw StoryException('Expected list, minimum and maximum for LIST_RANGE');
        }

        final result = targetList.value!.listWithSubRange(
          min.valueObject,
          max.valueObject,
        );
        state.pushEvaluationStack(ListValue.fromList(result));
        break;

      case CommandType.listRandom:
        final listVal = state.popEvaluationStack() as ListValue?;
        if (listVal == null) {
          throw StoryException('Expected list for LIST_RANDOM');
        }

        final list = listVal.value!;
        InkList newList;

        if (list.isEmpty) {
          newList = InkList();
        } else {
          final resultSeed = state.storySeed + state.previousRandom;
          final random = PRNG(resultSeed);
          final nextRandom = random.next();
          final listItemIndex = nextRandom % list.length;

          final entries = list.entries.toList();
          final randomEntry = entries[listItemIndex];
          final randomItem = InkListItem.fromSerializedKey(randomEntry.key);

          newList = InkList();
          if (randomItem.originName != null) {
            newList.setInitialOriginNames([randomItem.originName!]);
          }
          newList.add(randomItem, randomEntry.value);

          state.previousRandom = nextRandom;
        }

        state.pushEvaluationStack(ListValue.fromList(newList));
        break;

      default:
        error('unhandled ControlCommand: $evalCommand');
        break;
    }

    return true;
  }

  void _callExternalFunction(String? funcName, int numberOfArguments) {
    if (funcName == null) {
      throw StoryException('Function name is null');
    }

    final funcDef = _externals[funcName];
    Container? fallbackFunctionContainer;

    final foundExternal = funcDef != null;

    if (foundExternal && !funcDef!.lookAheadSafe && state.inStringEvaluation) {
      error(
        "External function $funcName could not be called because it wasn't marked as lookaheadSafe",
      );
    }

    if (foundExternal &&
        !funcDef!.lookAheadSafe &&
        _stateSnapshotAtLastNewline != null) {
      _sawLookaheadUnsafeFunctionAfterNewline = true;
      return;
    }

    if (!foundExternal) {
      if (allowExternalFunctionFallbacks) {
        fallbackFunctionContainer = knotContainerWithName(funcName);
        assert(
          fallbackFunctionContainer != null,
          "Trying to call EXTERNAL function '$funcName' which has not been bound, and fallback ink function could not be found.",
        );

        state.callStack.push(
          PushPopType.function,
          outputStreamLengthWithPushed: state.outputStream.length,
        );
        state.divertedPointer = Pointer.startOf(fallbackFunctionContainer!);
        return;
      } else {
        assert(
          false,
          "Trying to call EXTERNAL function '$funcName' which has not been bound (and ink fallbacks disabled).",
        );
      }
    }

    // Pop arguments
    final args = <dynamic>[];
    for (int i = 0; i < numberOfArguments; i++) {
      final poppedObj = state.popEvaluationStack() as Value?;
      args.add(poppedObj?.valueObject);
    }
    args.reversed.toList();

    // Run the function
    final funcResult = funcDef!.function(args);

    // Convert return value
    InkObject returnObj;
    if (funcResult != null) {
      returnObj = AbstractValue.create(funcResult) ?? Void();
    } else {
      returnObj = Void();
    }

    state.pushEvaluationStack(returnObj);
  }

  int _nextSequenceShuffleIndex() {
    final numElementsIntVal = state.popEvaluationStack() as IntValue?;
    if (numElementsIntVal == null) {
      error('expected number of elements in sequence for shuffle index');
      return 0;
    }

    final seqContainer = state.currentPointer.container;
    if (seqContainer == null) {
      return 0;
    }

    final numElements = numElementsIntVal.value!;
    final seqCountVal = state.popEvaluationStack() as IntValue?;
    final seqCount = seqCountVal?.value ?? 0;

    final loopIndex = seqCount ~/ numElements;
    final iterationIndex = seqCount % numElements;

    final seqPathStr = seqContainer.path.toString();
    int sequenceHash = 0;
    for (int i = 0; i < seqPathStr.length; i++) {
      sequenceHash += seqPathStr.codeUnitAt(i);
    }

    final randomSeed = sequenceHash + loopIndex + state.storySeed;
    final random = PRNG(randomSeed.floor());

    final unpickedIndices = List.generate(numElements, (i) => i);

    for (int i = 0; i <= iterationIndex; i++) {
      final chosen = random.next() % unpickedIndices.length;
      final chosenIndex = unpickedIndices[chosen];
      unpickedIndices.removeAt(chosen);

      if (i == iterationIndex) {
        return chosenIndex;
      }
    }

    throw StateError('Should never reach here');
  }

  void _nextContent() {
    state.previousPointer = state.currentPointer.copy();

    if (!state.divertedPointer.isNull) {
      state.currentPointer = state.divertedPointer.copy();
      state.divertedPointer = Pointer.null_();
      _visitChangedContainersDueToDivert();

      if (!state.currentPointer.isNull) return;
    }

    final successfulPointerIncrement = _incrementContentPointer();

    if (!successfulPointerIncrement) {
      bool didPop = false;

      if (state.callStack.canPop(PushPopType.function)) {
        state.popCallStack(PushPopType.function);

        if (state.inExpressionEvaluation) {
          state.pushEvaluationStack(Void());
        }

        didPop = true;
      } else if (state.callStack.canPopThread) {
        state.callStack.popThread();
        didPop = true;
      }

      if (didPop && !state.currentPointer.isNull) {
        _nextContent();
      }
    }
  }

  bool _incrementContentPointer() {
    bool successfulIncrement = true;

    final pointer = state.callStack.currentElement.currentPointer.copy();
    pointer.index++;

    if (pointer.container == null) return false;

    while (pointer.index >= pointer.container!.content.length) {
      successfulIncrement = false;

      final nextAncestor = pointer.container!.parent as Container?;
      if (nextAncestor == null) break;

      final indexInAncestor = nextAncestor.content.indexOf(pointer.container!);
      if (indexInAncestor == -1) break;

      pointer.container = nextAncestor;
      pointer.index = indexInAncestor + 1;

      successfulIncrement = true;
    }

    if (!successfulIncrement) {
      state.callStack.currentElement.currentPointer = Pointer.null_();
    } else {
      state.callStack.currentElement.currentPointer = pointer.copy();
    }

    return successfulIncrement;
  }

  void _visitChangedContainersDueToDivert() {
    final previousPointer = state.previousPointer.copy();
    final pointer = state.currentPointer.copy();

    if (pointer.isNull || pointer.index == -1) return;

    final prevContainers = <Container>[];
    if (!previousPointer.isNull) {
      final resolved = previousPointer.resolve();
      Container? prevAncestor =
          resolved is Container ? resolved : previousPointer.container;
      while (prevAncestor != null) {
        prevContainers.add(prevAncestor);
        prevAncestor = prevAncestor.parent is Container ? prevAncestor.parent as Container : null;
      }
    }

    var currentChildOfContainer = pointer.resolve();
    if (currentChildOfContainer == null) return;

    Container? currentContainerAncestor =
        currentChildOfContainer.parent is Container ? currentChildOfContainer.parent as Container : null;
    bool allChildrenEnteredAtStart = true;

    while (currentContainerAncestor != null &&
        (!prevContainers.contains(currentContainerAncestor) ||
            currentContainerAncestor.countingAtStartOnly)) {
      final enteringAtStart = currentContainerAncestor.content.isNotEmpty &&
          currentChildOfContainer == currentContainerAncestor.content[0] &&
          allChildrenEnteredAtStart;

      if (!enteringAtStart) allChildrenEnteredAtStart = false;

      _visitContainer(currentContainerAncestor, enteringAtStart);

      currentChildOfContainer = currentContainerAncestor;
      currentContainerAncestor = currentContainerAncestor.parent as Container?;
    }
  }

  bool _tryFollowDefaultInvisibleChoice() {
    final allChoices = _state!.currentChoices;
    final invisibleChoices =
        allChoices.where((c) => c.isInvisibleDefault).toList();

    if (invisibleChoices.isEmpty ||
        allChoices.length > invisibleChoices.length) {
      return false;
    }

    final choice = invisibleChoices[0];
    if (choice.targetPath == null || choice.threadAtGeneration == null) {
      return false;
    }

    state.callStack.currentThread = choice.threadAtGeneration!;

    if (_stateSnapshotAtLastNewline != null) {
      state.callStack.currentThread = state.callStack.forkThread();
    }

    choosePath(choice.targetPath!, false);
    return true;
  }

  /// Choose a path string.
  void choosePathString(
    String path, [
    bool resetCallstack = true,
    List<dynamic>? args,
  ]) {
    _ifAsyncWeCant('call ChoosePathString right now');
    onChoosePathString?.call(path, args ?? []);

    if (resetCallstack) {
      resetCallstack;
    } else {
      if (state.callStack.currentElement.type == PushPopType.function) {
        throw StoryException(
          'Story was running a function when you called ChoosePathString - this is almost certainly not what you want!',
        );
      }
    }

    state.passArgumentsToEvaluationStack(args);
    choosePath(Path.fromString(path));
  }

  /// Choose a path.
  void choosePath(Path p, [bool incrementingTurnIndex = true]) {
    state.setChosenPath(p, incrementingTurnIndex);
    _visitChangedContainersDueToDivert();
  }

  /// Choose a choice by index.
  void chooseChoiceIndex(int choiceIdx) {
    final choices = currentChoices;
    assert(
      choiceIdx >= 0 && choiceIdx < choices.length,
      'choice out of range',
    );

    final choiceToChoose = choices[choiceIdx];
    onMakeChoice?.call(choiceToChoose);

    if (choiceToChoose.threadAtGeneration == null ||
        choiceToChoose.targetPath == null) {
      throw StoryException('Choice thread or target path is null');
    }

    state.callStack.currentThread = choiceToChoose.threadAtGeneration!;
    choosePath(choiceToChoose.targetPath!);
  }

  /// Check if a function exists.
  bool hasFunction(String functionName) {
    try {
      return knotContainerWithName(functionName) != null;
    } catch (e) {
      return false;
    }
  }

  /// Evaluate a function.
  dynamic evaluateFunction(
    String functionName, [
    List<dynamic>? args,
    bool returnTextOutput = false,
  ]) {
    onEvaluateFunction?.call(functionName, args ?? []);
    _ifAsyncWeCant('evaluate a function');

    if (functionName.isEmpty) {
      throw StoryException('Function is empty or white space.');
    }

    final funcContainer = knotContainerWithName(functionName);
    if (funcContainer == null) {
      throw StoryException("Function doesn't exist: '$functionName'");
    }

    final outputStreamBefore = List<InkObject>.from(state.outputStream);
    _state!.resetOutput();

    state.startFunctionEvaluationFromGame(funcContainer, args ?? []);

    final stringOutput = StringBuffer();
    while (canContinue) {
      stringOutput.write(continueStory());
    }
    final textOutput = stringOutput.toString();

    _state!.resetOutput(outputStreamBefore);

    final result = state.completeFunctionEvaluationFromGame();
    onCompleteEvaluateFunction?.call(
      functionName,
      args ?? [],
      textOutput,
      result,
    );

    return returnTextOutput
        ? {'returned': result, 'output': textOutput}
        : result;
  }

  /// Bind an external function.
  void bindExternalFunction(
    String funcName,
    ExternalFunction func, [
    bool lookaheadSafe = false,
  ]) {
    _ifAsyncWeCant('bind an external function');
    assert(!_externals.containsKey(funcName), "Function '$funcName' has already been bound.");

    _externals[funcName] = _ExternalFunctionDef(func, lookaheadSafe);
  }

  /// Unbind an external function.
  void unbindExternalFunction(String funcName) {
    _ifAsyncWeCant('unbind an external a function');
    assert(_externals.containsKey(funcName), "Function '$funcName' has not been bound.");
    _externals.remove(funcName);
  }

  /// Validate external bindings.
  void validateExternalBindings([Container? c, Set<String>? missingExternals]) {
    if (c == null && missingExternals == null) {
      missingExternals = {};
      validateExternalBindings(_mainContentContainer, missingExternals);
      _hasValidatedExternals = true;

      if (missingExternals.isNotEmpty) {
        final message = StringBuffer('Error: Missing function binding for external');
        if (missingExternals.length > 1) message.write('s');
        message.write(": '${missingExternals.join("', '")}' ");
        message.write(
          allowExternalFunctionFallbacks
              ? ', and no fallback ink function found.'
              : ' (ink fallbacks disabled)',
        );
        error(message.toString());
      }
      return;
    }

    missingExternals ??= {};

    if (c != null) {
      for (final innerContent in c.content) {
        final container = innerContent is Container ? innerContent : null;
        if (container == null || !container.hasValidName) {
          validateExternalBindings(innerContent is Container ? innerContent : null, missingExternals);
        }
      }
      for (final namedContent in c.namedContent.values) {
        validateExternalBindings(namedContent is Container ? namedContent : null, missingExternals);
      }
    }
  }

  /// Observe a variable.
  void observeVariable(String variableName, VariableObserver observer) {
    _ifAsyncWeCant('observe a new variable');

    _variableObservers ??= {};

    if (!state.variablesState.globalVariableExistsWithName(variableName)) {
      throw StoryException(
        "Cannot observe variable '$variableName' because it wasn't declared in the ink story.",
      );
    }

    if (_variableObservers!.containsKey(variableName)) {
      _variableObservers![variableName]!.add(observer);
    } else {
      _variableObservers![variableName] = [observer];
    }
  }

  /// Remove a variable observer.
  void removeVariableObserver([
    VariableObserver? observer,
    String? specificVariableName,
  ]) {
    _ifAsyncWeCant('remove a variable observer');

    if (_variableObservers == null) return;

    if (specificVariableName != null) {
      if (_variableObservers!.containsKey(specificVariableName)) {
        if (observer != null) {
          _variableObservers![specificVariableName]!.remove(observer);
          if (_variableObservers![specificVariableName]!.isEmpty) {
            _variableObservers!.remove(specificVariableName);
          }
        } else {
          _variableObservers!.remove(specificVariableName);
        }
      }
    } else if (observer != null) {
      for (final varName in _variableObservers!.keys.toList()) {
        _variableObservers![varName]!.remove(observer);
        if (_variableObservers![varName]!.isEmpty) {
          _variableObservers!.remove(varName);
        }
      }
    }
  }

  void _variableStateDidChangeEvent(String variableName, InkObject newValueObj) {
    if (_variableObservers == null) return;

    final observers = _variableObservers![variableName];
    if (observers != null) {
      if (newValueObj is! Value) {
        throw StoryException("Tried to get the value of a variable that isn't a standard type");
      }
      for (final observer in observers) {
        observer(variableName, newValueObj.valueObject);
      }
    }
  }

  /// Get global tags.
  List<String>? get globalTags => tagsAtStartOfFlowContainerWithPathString('');

  /// Get tags for content at path.
  List<String>? tagsForContentAtPath(String path) {
    return tagsAtStartOfFlowContainerWithPathString(path);
  }

  /// Get tags at start of flow container.
  List<String>? tagsAtStartOfFlowContainerWithPathString(String pathString) {
    final path = Path.fromString(pathString);
    var flowContainer = contentAtPath(path).container;
    if (flowContainer == null) return null;

    while (true) {
      final firstContent = flowContainer!.content.isNotEmpty
          ? flowContainer.content[0]
          : null;
      if (firstContent is Container) {
        flowContainer = firstContent;
      } else {
        break;
      }
    }

    bool inTag = false;
    List<String>? tags;

    for (final c in flowContainer.content) {
      if (c is ControlCommand) {
        if (c.commandType == CommandType.beginTag) {
          inTag = true;
        } else if (c.commandType == CommandType.endTag) {
          inTag = false;
        }
      } else if (inTag) {
        if (c is StringValue) {
          tags ??= [];
          if (c.value != null) tags.add(c.value!);
        } else {
          error(
            'Tag contained non-text content. Only plain text is allowed when using globalTags or TagsAtContentPath.',
          );
        }
      } else {
        break;
      }
    }

    return tags;
  }

  void _ifAsyncWeCant(String activityStr) {
    if (_asyncContinueActive) {
      throw StoryException(
        "Can't $activityStr. Story is in the middle of a ContinueAsync(). Make more ContinueAsync() calls or a single Continue() call beforehand.",
      );
    }
  }

  /// Report an error.
  Never error(String message, {bool useEndLineNumber = false}) {
    final e = StoryException(message);
    e.useEndLineNumber = useEndLineNumber;
    throw e;
  }

  /// Report a warning.
  void warning(String message) {
    addError(message, isWarning: true);
  }

  /// Add an error or warning.
  void addError(String message, {bool isWarning = false, bool useEndLineNumber = false}) {
    state.addError(message, isWarning);
    if (!isWarning) state.forceEnd();
  }

  @override
  String toString() => 'Story(${_mainContentContainer?.name ?? 'unnamed'})';
}

/// Output state change types.
enum OutputStateChange {
  noChange,
  extendedBeyondNewline,
  newlineRemoved,
}

class _ExternalFunctionDef {
  final ExternalFunction function;
  final bool lookAheadSafe;

  _ExternalFunctionDef(this.function, this.lookAheadSafe);
}

extension on StoryState {
  void startFunctionEvaluationFromGame(Container funcContainer, List<dynamic> args) {
    callStack.push(
      PushPopType.functionEvaluationFromGame,
      externalEvaluationStackHeight: evaluationStack.length,
    );
    callStack.currentElement.currentPointer = Pointer.startOf(funcContainer);
    passArgumentsToEvaluationStack(args);
  }

  void passArgumentsToEvaluationStack(List<dynamic>? args) {
    if (args != null) {
      for (final arg in args) {
        if (arg is! num && arg is! String && arg is! bool && arg is! InkList) {
          throw StoryException(
            'ink arguments when calling EvaluateFunction must be number, string, bool or InkList. Argument was ${arg?.runtimeType}',
          );
        }
        pushEvaluationStack(AbstractValue.create(arg)!);
      }
    }
  }

  dynamic completeFunctionEvaluationFromGame() {
    if (callStack.currentElement.type != PushPopType.functionEvaluationFromGame) {
      throw StoryException('Expected external function evaluation to be complete.');
    }

    final originalEvaluationStackHeight =
        callStack.currentElement.evaluationStackHeightWhenPushed ?? 0;

    InkObject? returnedObj;
    while (evaluationStack.length > originalEvaluationStackHeight) {
      final poppedObj = popEvaluationStack();
      returnedObj ??= poppedObj;
    }

    popCallStack(PushPopType.functionEvaluationFromGame);

    if (returnedObj != null) {
      if (returnedObj is Void) return null;

      final returnVal = returnedObj as Value;
      if (returnVal.valueType == ValueType.divertTarget) {
        return '-> ${returnVal.valueObject}';
      }
      return returnVal.valueObject;
    }

    return null;
  }
}

extension on CallStack {
  bool get elementIsEvaluateFromGame =>
      currentElement.type == PushPopType.functionEvaluationFromGame;
}

extension on List<Choice> {
  void push(Choice c) => add(c);
}
