import 'ink_object.dart';
import 'value.dart';
import 'call_stack.dart';
import 'variable_assignment.dart';
import 'list_definitions_origin.dart';
import 'state_patch.dart';
import 'simple_json.dart';
import 'story_exception.dart';

/// Manages all variable storage in the Ink runtime.
///
/// Handles both global variables (declared in story) and
/// temporary variables (scoped to function calls).
class VariablesState {
  final List<void Function(String, InkObject)> _variableChangedCallbacks = [];

  Map<String, InkObject> _globalVariables = {};
  Map<String, InkObject> _defaultGlobalVariables = {};

  CallStack _callStack;
  ListDefinitionsOrigin? _listDefsOrigin;

  StatePatch? patch;

  bool _batchObservingVariableChanges = false;
  Set<String>? _changedVariablesForBatchObs;

  VariablesState(this._callStack, this._listDefsOrigin);

  /// Get the call stack.
  CallStack get callStack => _callStack;

  /// Set the call stack.
  set callStack(CallStack value) => _callStack = value;

  /// Start observing variable changes for batch notification.
  void startVariableObservation() {
    _batchObservingVariableChanges = true;
    _changedVariablesForBatchObs = {};
  }

  /// Complete variable observation and get changed variables.
  Map<String, dynamic> completeVariableObservation() {
    _batchObservingVariableChanges = false;
    final changedVars = <String, dynamic>{};

    if (_changedVariablesForBatchObs != null) {
      for (final variableName in _changedVariablesForBatchObs!) {
        final currentValue = _globalVariables[variableName];
        if (currentValue != null) {
          _fireVariableChanged(variableName, currentValue);
        }
      }
    }

    if (patch != null) {
      for (final variableName in patch!.changedVariables) {
        final patchedVal = patch!.tryGetGlobal(variableName, null);
        if (patchedVal.exists) {
          changedVars[variableName] = patchedVal.result;
        }
      }
    }

    _changedVariablesForBatchObs = null;
    return changedVars;
  }

  /// Notify observers of changed variables.
  void notifyObservers(Map<String, dynamic> changedVars) {
    for (final entry in changedVars.entries) {
      _fireVariableChanged(entry.key, entry.value as InkObject);
    }
  }

  void _fireVariableChanged(String name, InkObject value) {
    for (final callback in _variableChangedCallbacks) {
      callback(name, value);
    }
  }

  /// Apply the current patch to global variables.
  void applyPatch() {
    if (patch == null) return;

    for (final entry in patch!.globals.entries) {
      _globalVariables[entry.key] = entry.value;
    }

    if (_changedVariablesForBatchObs != null) {
      for (final name in patch!.changedVariables) {
        _changedVariablesForBatchObs!.add(name);
      }
    }

    patch = null;
  }

  /// Get a variable value by name.
  dynamic operator [](String variableName) {
    if (patch != null) {
      final patchResult = patch!.tryGetGlobal(variableName, null);
      if (patchResult.exists) {
        return (patchResult.result as AbstractValue?)?.valueObject;
      }
    }

    var varContents = _globalVariables[variableName];
    varContents ??= _defaultGlobalVariables[variableName];

    if (varContents != null) {
      return (varContents as AbstractValue).valueObject;
    }
    return null;
  }

  /// Set a variable value by name.
  void operator []=(String variableName, dynamic value) {
    if (!_defaultGlobalVariables.containsKey(variableName)) {
      throw StoryException(
        "Cannot assign to a variable ($variableName) that hasn't been declared in the story",
      );
    }

    final val = AbstractValue.create(value);
    if (val == null) {
      if (value == null) {
        throw ArgumentError('Cannot pass null to VariableState');
      } else {
        throw ArgumentError('Invalid value passed to VariableState: $value');
      }
    }

    setGlobal(variableName, val);
  }

  /// Load variables from JSON.
  void setJsonToken(Map<String, dynamic> jToken) {
    _globalVariables.clear();

    for (final entry in _defaultGlobalVariables.entries) {
      final loadedToken = jToken[entry.key];
      if (loadedToken != null) {
        // TODO: Use JsonSerialisation.jTokenToRuntimeObject
        _globalVariables[entry.key] = entry.value;
      } else {
        _globalVariables[entry.key] = entry.value;
      }
    }
  }

  /// Whether to skip saving default values.
  static bool dontSaveDefaultValues = true;

  /// Write variables to JSON.
  void writeJson(SimpleJsonWriter writer) {
    writer.writeObjectStart();
    for (final entry in _globalVariables.entries) {
      final name = entry.key;
      final val = entry.value;

      if (dontSaveDefaultValues) {
        if (_defaultGlobalVariables.containsKey(name)) {
          final defaultVal = _defaultGlobalVariables[name]!;
          if (_runtimeObjectsEqual(val, defaultVal)) continue;
        }
      }

      writer.writePropertyStart(name);
      // TODO: JsonSerialisation.writeRuntimeObject(writer, val);
      writer.writePropertyEnd();
    }
    writer.writeObjectEnd();
  }

  bool _runtimeObjectsEqual(InkObject obj1, InkObject obj2) {
    if (obj1.runtimeType != obj2.runtimeType) return false;

    if (obj1 is BoolValue && obj2 is BoolValue) {
      return obj1.value == obj2.value;
    }
    if (obj1 is IntValue && obj2 is IntValue) {
      return obj1.value == obj2.value;
    }
    if (obj1 is FloatValue && obj2 is FloatValue) {
      return obj1.value == obj2.value;
    }
    if (obj1 is AbstractValue && obj2 is AbstractValue) {
      return obj1.valueObject == obj2.valueObject;
    }

    return false;
  }

  /// Get a variable with name, resolving pointers.
  InkObject? getVariableWithName(String? name, [int contextIndex = -1]) {
    var varValue = getRawVariableWithName(name, contextIndex);

    if (varValue is VariablePointerValue) {
      varValue = valueAtVariablePointer(varValue);
    }

    return varValue;
  }

  /// Try to get a default variable value.
  InkObject? tryGetDefaultVariableValue(String? name) {
    if (name == null) return null;
    return _defaultGlobalVariables[name];
  }

  /// Check if a global variable exists.
  bool globalVariableExistsWithName(String name) {
    return _globalVariables.containsKey(name) ||
        _defaultGlobalVariables.containsKey(name);
  }

  /// Get a raw variable without resolving pointers.
  InkObject? getRawVariableWithName(String? name, int contextIndex) {
    if (name == null) return null;

    if (contextIndex == 0 || contextIndex == -1) {
      if (patch != null) {
        final patchResult = patch!.tryGetGlobal(name, null);
        if (patchResult.exists) return patchResult.result;
      }

      if (_globalVariables.containsKey(name)) {
        return _globalVariables[name];
      }

      if (_defaultGlobalVariables.containsKey(name)) {
        return _defaultGlobalVariables[name];
      }

      if (_listDefsOrigin != null) {
        final listItemValue = _listDefsOrigin!.findSingleItemListWithName(name);
        if (listItemValue != null) return listItemValue;
      }
    }

    return _callStack.getTemporaryVariableWithName(name, contextIndex);
  }

  /// Get value at a variable pointer.
  InkObject? valueAtVariablePointer(VariablePointerValue pointer) {
    return getVariableWithName(pointer.variableName, pointer.contextIndex);
  }

  /// Assign a value to a variable.
  void assign(VariableAssignment varAss, InkObject value) {
    var name = varAss.variableName;
    if (name == null) {
      throw StateError('Variable name is null');
    }

    var contextIndex = -1;
    bool setGlobal;

    if (varAss.isNewDeclaration) {
      setGlobal = varAss.isGlobal;
    } else {
      setGlobal = globalVariableExistsWithName(name);
    }

    if (varAss.isNewDeclaration) {
      if (value is VariablePointerValue) {
        final fullyResolvedPointer = resolveVariablePointer(value);
        value = fullyResolvedPointer;
      }
    } else {
      VariablePointerValue? existingPointer;
      do {
        // Use safe type check instead of cast - value may be any InkObject type
        final rawVar = getRawVariableWithName(name, contextIndex);
        existingPointer = rawVar is VariablePointerValue ? rawVar : null;
        if (existingPointer != null) {
          name = existingPointer.variableName;
          contextIndex = existingPointer.contextIndex;
          // Check if the variable is actually a global, not just at context 0
          // Context 0 can also contain temp variables (from knots/stitches)
          setGlobal = globalVariableExistsWithName(name);
        }
      } while (existingPointer != null);
    }

    if (setGlobal) {
      this.setGlobal(name!, value);
    } else {
      _callStack.setTemporaryVariable(
        name!,
        value,
        varAss.isNewDeclaration,
        contextIndex,
      );
    }
  }

  /// Snapshot current globals as defaults.
  void snapshotDefaultGlobals() {
    _defaultGlobalVariables = Map.from(_globalVariables);
  }

  /// Set a global variable.
  void setGlobal(String variableName, InkObject value) {
    ({bool exists, InkObject? result})? oldValue;

    if (patch == null) {
      oldValue = (
        exists: _globalVariables.containsKey(variableName),
        result: _globalVariables[variableName],
      );
    } else {
      oldValue = patch!.tryGetGlobal(variableName, null);
      if (!oldValue.exists) {
        oldValue = (
          exists: _globalVariables.containsKey(variableName),
          result: _globalVariables[variableName],
        );
      }
    }

    // Retain list origins
    if (oldValue?.result != null && value is ListValue && oldValue!.result is ListValue) {
      final oldList = oldValue.result as ListValue;
      final newList = value;
      if (newList.value != null && newList.value!.isEmpty && oldList.value?.originNames != null) {
        newList.value!.setInitialOriginNames(oldList.value!.originNames!);
      }
    }

    if (patch != null) {
      patch!.setGlobal(variableName, value);
    } else {
      _globalVariables[variableName] = value;
    }

    if (oldValue != null && value != oldValue.result) {
      if (_batchObservingVariableChanges) {
        if (patch != null) {
          patch!.addChangedVariable(variableName);
        } else {
          _changedVariablesForBatchObs?.add(variableName);
        }
      } else {
        _fireVariableChanged(variableName, value);
      }
    }
  }

  /// Resolve a variable pointer to its target.
  VariablePointerValue resolveVariablePointer(VariablePointerValue varPointer) {
    var contextIndex = varPointer.contextIndex;

    if (contextIndex == -1) {
      contextIndex = getContextIndexOfVariableNamed(varPointer.variableName!);
    }

    final valueOfVariablePointedTo = getRawVariableWithName(
      varPointer.variableName,
      contextIndex,
    );

    if (valueOfVariablePointedTo is VariablePointerValue) {
      return valueOfVariablePointedTo;
    } else {
      return VariablePointerValue(varPointer.variableName, contextIndex);
    }
  }

  /// Get the context index for a variable name.
  int getContextIndexOfVariableNamed(String varName) {
    if (globalVariableExistsWithName(varName)) return 0;
    return _callStack.currentElementIndex;
  }

  /// Register a callback for variable changes.
  void observeVariableChange(void Function(String, InkObject) callback) {
    _variableChangedCallbacks.add(callback);
  }
}
