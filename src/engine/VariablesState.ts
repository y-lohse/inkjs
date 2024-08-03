import {
  AbstractValue,
  Value,
  VariablePointerValue,
  ListValue,
  IntValue,
  FloatValue,
  BoolValue,
} from "./Value";
import { VariableAssignment } from "./VariableAssignment";
import { InkObject } from "./Object";
import { ListDefinitionsOrigin } from "./ListDefinitionsOrigin";
import { StoryException } from "./StoryException";
import { JsonSerialisation } from "./JsonSerialisation";
import { asOrThrows, asOrNull, isEquatable } from "./TypeAssertion";
import { tryGetValueFromMap } from "./TryGetResult";
import { throwNullException } from "./NullException";
import { CallStack } from "./CallStack";
import { StatePatch } from "./StatePatch";
import { SimpleJson } from "./SimpleJson";
import { InkList } from "./Story";
import { Path } from "./Path";

// Fake class wrapper around VariableState to have correct typing
// when using the Proxy syntax in typescript
function VariablesStateAccessor<T>(): new () => Pick<T, keyof T> {
  return class {} as any;
}

type VariableStateValue = boolean | string | number | InkList | Path | null;

export class VariablesState extends VariablesStateAccessor<
  Record<string, any>
>() {
  // The way variableChangedEvent is a bit different than the reference implementation.
  // Originally it uses the C# += operator to add delegates, but in js we need to maintain
  // an actual collection of delegates (ie. callbacks) to register a new one, there is a
  // special ObserveVariableChange method below.
  public variableChangedEventCallbacks: Array<
    (variableName: string, newValue: InkObject) => void
  > = [];
  public variableChangedEvent(variableName: string, newValue: InkObject): void {
    for (let callback of this.variableChangedEventCallbacks) {
      callback(variableName, newValue);
    }
  }

  public patch: StatePatch | null = null;

  public StartVariableObservation() {
    this._batchObservingVariableChanges = true;
    this._changedVariablesForBatchObs = new Set();
  }

  public CompleteVariableObservation(): Map<string, any> {
    this._batchObservingVariableChanges = false;
    let changedVars = new Map<string, any>();
    if (this._changedVariablesForBatchObs != null) {
      for (let variableName of this._changedVariablesForBatchObs) {
        let currentValue = this._globalVariables.get(variableName) as InkObject;
        this.variableChangedEvent(variableName, currentValue);
      }
    }
    // Patch may still be active - e.g. if we were in the middle of a background save
    if (this.patch != null) {
      for (let variableName of this.patch.changedVariables) {
        let patchedVal = this.patch.TryGetGlobal(variableName, null);
        if (patchedVal.exists) changedVars.set(variableName, patchedVal);
      }
    }
    this._changedVariablesForBatchObs = null;
    return changedVars;
  }

  public NotifyObservers(changedVars: Map<string, any>) {
    for (const [key, value] of changedVars) {
      this.variableChangedEvent(key, value);
    }
  }

  get callStack() {
    return this._callStack;
  }
  set callStack(callStack) {
    this._callStack = callStack;
  }

  // the original code uses a magic getter and setter for global variables,
  // allowing things like variableState['varname]. This is not quite possible
  // in js without a Proxy, so it is replaced with this $ function.
  public $(variableName: string): VariableStateValue;
  public $(variableName: string, value: VariableStateValue): void;
  public $(variableName: string, value?: any) {
    if (typeof value === "undefined") {
      let varContents = null;

      if (this.patch !== null) {
        varContents = this.patch.TryGetGlobal(variableName, null);
        if (varContents.exists)
          return (varContents.result as AbstractValue).valueObject;
      }

      varContents = this._globalVariables.get(variableName);

      if (typeof varContents === "undefined") {
        varContents = this._defaultGlobalVariables.get(variableName);
      }

      if (typeof varContents !== "undefined")
        return (varContents as AbstractValue).valueObject;
      else return null;
    } else {
      if (typeof this._defaultGlobalVariables.get(variableName) === "undefined")
        throw new StoryException(
          "Cannot assign to a variable (" +
            variableName +
            ") that hasn't been declared in the story"
        );

      let val = Value.Create(value);
      if (val == null) {
        if (value == null) {
          throw new Error("Cannot pass null to VariableState");
        } else {
          throw new Error(
            "Invalid value passed to VariableState: " + value.toString()
          );
        }
      }

      this.SetGlobal(variableName, val);
    }
  }

  constructor(
    callStack: CallStack,
    listDefsOrigin: ListDefinitionsOrigin | null
  ) {
    super();
    this._globalVariables = new Map();
    this._callStack = callStack;
    this._listDefsOrigin = listDefsOrigin;

    // if es6 proxies are available, use them.
    try {
      // the proxy is used to allow direct manipulation of global variables.
      // It first tries to access the objects own property, and if none is
      // found it delegates the call to the $ method, defined below
      let p = new Proxy(this, {
        get(target: any, name) {
          return name in target ? target[name] : target.$(name);
        },
        set(target: any, name, value) {
          if (name in target) target[name] = value;
          else target.$(name, value);
          return true; // returning a falsy value make the trap fail
        },
      });

      return p;
    } catch (e) {
      // the proxy object is not available in this context. we should warn the
      // dev but writing to the console feels a bit intrusive.
      // console.log("ES6 Proxy not available - direct manipulation of global variables can't work, use $() instead.");
    }
  }

  public ApplyPatch() {
    if (this.patch === null) {
      return throwNullException("this.patch");
    }

    for (let [namedVarKey, namedVarValue] of this.patch.globals) {
      this._globalVariables.set(namedVarKey, namedVarValue);
    }

    if (this._changedVariablesForBatchObs !== null) {
      for (let name of this.patch.changedVariables) {
        this._changedVariablesForBatchObs.add(name);
      }
    }

    this.patch = null;
  }

  public SetJsonToken(jToken: Record<string, any>) {
    this._globalVariables.clear();

    for (let [varValKey, varValValue] of this._defaultGlobalVariables) {
      let loadedToken = jToken[varValKey];
      if (typeof loadedToken !== "undefined") {
        let tokenInkObject =
          JsonSerialisation.JTokenToRuntimeObject(loadedToken);
        if (tokenInkObject === null) {
          return throwNullException("tokenInkObject");
        }
        this._globalVariables.set(varValKey, tokenInkObject);
      } else {
        this._globalVariables.set(varValKey, varValValue);
      }
    }
  }

  public static dontSaveDefaultValues: boolean = true;

  public WriteJson(writer: SimpleJson.Writer) {
    writer.WriteObjectStart();
    for (let [keyValKey, keyValValue] of this._globalVariables) {
      let name = keyValKey;
      let val = keyValValue;

      if (VariablesState.dontSaveDefaultValues) {
        if (this._defaultGlobalVariables.has(name)) {
          let defaultVal = this._defaultGlobalVariables.get(name)!;
          if (this.RuntimeObjectsEqual(val, defaultVal)) continue;
        }
      }

      writer.WritePropertyStart(name);
      JsonSerialisation.WriteRuntimeObject(writer, val);
      writer.WritePropertyEnd();
    }
    writer.WriteObjectEnd();
  }

  public RuntimeObjectsEqual(
    obj1: InkObject | null,
    obj2: InkObject | null
  ): boolean {
    if (obj1 === null) {
      return throwNullException("obj1");
    }
    if (obj2 === null) {
      return throwNullException("obj2");
    }

    if (obj1.constructor !== obj2.constructor) return false;

    let boolVal = asOrNull(obj1, BoolValue);
    if (boolVal !== null) {
      return boolVal.value === asOrThrows(obj2, BoolValue).value;
    }

    let intVal = asOrNull(obj1, IntValue);
    if (intVal !== null) {
      return intVal.value === asOrThrows(obj2, IntValue).value;
    }

    let floatVal = asOrNull(obj1, FloatValue);
    if (floatVal !== null) {
      return floatVal.value === asOrThrows(obj2, FloatValue).value;
    }

    let val1 = asOrNull(obj1, Value);
    let val2 = asOrNull(obj2, Value);
    if (val1 !== null && val2 !== null) {
      if (isEquatable(val1.valueObject) && isEquatable(val2.valueObject)) {
        return val1.valueObject.Equals(val2.valueObject);
      } else {
        return val1.valueObject === val2.valueObject;
      }
    }

    throw new Error(
      "FastRoughDefinitelyEquals: Unsupported runtime object type: " +
        obj1.constructor.name
    );
  }

  public GetVariableWithName(
    name: string | null,
    contextIndex: number = -1
  ): InkObject | null {
    let varValue = this.GetRawVariableWithName(name, contextIndex);

    // var varPointer = varValue as VariablePointerValue;
    let varPointer = asOrNull(varValue, VariablePointerValue);
    if (varPointer !== null) {
      varValue = this.ValueAtVariablePointer(varPointer);
    }

    return varValue;
  }

  public TryGetDefaultVariableValue(name: string | null): InkObject | null {
    let val = tryGetValueFromMap(this._defaultGlobalVariables, name, null);
    return val.exists ? val.result : null;
  }

  public GlobalVariableExistsWithName(name: string) {
    return (
      this._globalVariables.has(name) ||
      (this._defaultGlobalVariables !== null &&
        this._defaultGlobalVariables.has(name))
    );
  }

  public GetRawVariableWithName(name: string | null, contextIndex: number) {
    let varValue: InkObject | null = null;

    if (contextIndex == 0 || contextIndex == -1) {
      let variableValue = null;
      if (this.patch !== null) {
        variableValue = this.patch.TryGetGlobal(name, null);
        if (variableValue.exists) return variableValue.result!;
      }

      // this is a conditional assignment
      variableValue = tryGetValueFromMap(this._globalVariables, name, null);
      if (variableValue.exists) return variableValue.result;

      if (this._defaultGlobalVariables !== null) {
        variableValue = tryGetValueFromMap(
          this._defaultGlobalVariables,
          name,
          null
        );
        if (variableValue.exists) return variableValue.result;
      }

      if (this._listDefsOrigin === null)
        return throwNullException("VariablesState._listDefsOrigin");
      let listItemValue = this._listDefsOrigin.FindSingleItemListWithName(name);
      if (listItemValue) return listItemValue;
    }

    varValue = this._callStack.GetTemporaryVariableWithName(name, contextIndex);

    return varValue;
  }

  public ValueAtVariablePointer(pointer: VariablePointerValue) {
    return this.GetVariableWithName(pointer.variableName, pointer.contextIndex);
  }

  public Assign(varAss: VariableAssignment, value: InkObject) {
    let name = varAss.variableName;
    if (name === null) {
      return throwNullException("name");
    }
    let contextIndex = -1;

    let setGlobal = false;
    if (varAss.isNewDeclaration) {
      setGlobal = varAss.isGlobal;
    } else {
      setGlobal = this.GlobalVariableExistsWithName(name);
    }

    if (varAss.isNewDeclaration) {
      // var varPointer = value as VariablePointerValue;
      let varPointer = asOrNull(value, VariablePointerValue);
      if (varPointer !== null) {
        let fullyResolvedVariablePointer =
          this.ResolveVariablePointer(varPointer);
        value = fullyResolvedVariablePointer;
      }
    } else {
      let existingPointer = null;
      do {
        // existingPointer = GetRawVariableWithName (name, contextIndex) as VariablePointerValue;
        existingPointer = asOrNull(
          this.GetRawVariableWithName(name, contextIndex),
          VariablePointerValue
        );
        if (existingPointer != null) {
          name = existingPointer.variableName;
          contextIndex = existingPointer.contextIndex;
          setGlobal = contextIndex == 0;
        }
      } while (existingPointer != null);
    }

    if (setGlobal) {
      this.SetGlobal(name, value);
    } else {
      this._callStack.SetTemporaryVariable(
        name,
        value,
        varAss.isNewDeclaration,
        contextIndex
      );
    }
  }

  public SnapshotDefaultGlobals() {
    this._defaultGlobalVariables = new Map(this._globalVariables);
  }

  public RetainListOriginsForAssignment(
    oldValue: InkObject,
    newValue: InkObject
  ) {
    let oldList = asOrThrows(oldValue, ListValue);
    let newList = asOrThrows(newValue, ListValue);

    if (oldList.value && newList.value && newList.value.Count == 0) {
      newList.value.SetInitialOriginNames(oldList.value.originNames);
    }
  }

  public SetGlobal(variableName: string | null, value: InkObject) {
    let oldValue = null;

    if (this.patch === null) {
      oldValue = tryGetValueFromMap(this._globalVariables, variableName, null);
    }

    if (this.patch !== null) {
      oldValue = this.patch.TryGetGlobal(variableName, null);
      if (!oldValue.exists) {
        oldValue = tryGetValueFromMap(
          this._globalVariables,
          variableName,
          null
        );
      }
    }

    ListValue.RetainListOriginsForAssignment(oldValue!.result!, value);

    if (variableName === null) {
      return throwNullException("variableName");
    }

    if (this.patch !== null) {
      this.patch.SetGlobal(variableName, value);
    } else {
      this._globalVariables.set(variableName, value);
    }

    // TODO: Not sure !== is equivalent to !value.Equals(oldValue)
    if (
      this.variableChangedEvent !== null &&
      oldValue !== null &&
      value !== oldValue.result
    ) {
      if (this._batchObservingVariableChanges) {
        if (this._changedVariablesForBatchObs === null) {
          return throwNullException("this._changedVariablesForBatchObs");
        }

        if (this.patch !== null) {
          this.patch.AddChangedVariable(variableName);
        } else if (this._changedVariablesForBatchObs !== null) {
          this._changedVariablesForBatchObs.add(variableName);
        }
      } else {
        this.variableChangedEvent(variableName, value);
      }
    }
  }

  public ResolveVariablePointer(varPointer: VariablePointerValue) {
    let contextIndex = varPointer.contextIndex;

    if (contextIndex == -1)
      contextIndex = this.GetContextIndexOfVariableNamed(
        varPointer.variableName
      );

    let valueOfVariablePointedTo = this.GetRawVariableWithName(
      varPointer.variableName,
      contextIndex
    );

    // var doubleRedirectionPointer = valueOfVariablePointedTo as VariablePointerValue;
    let doubleRedirectionPointer = asOrNull(
      valueOfVariablePointedTo,
      VariablePointerValue
    );
    if (doubleRedirectionPointer != null) {
      return doubleRedirectionPointer;
    } else {
      return new VariablePointerValue(varPointer.variableName, contextIndex);
    }
  }

  public GetContextIndexOfVariableNamed(varName: string) {
    if (this.GlobalVariableExistsWithName(varName)) return 0;

    return this._callStack.currentElementIndex;
  }

  /**
   * This function is specific to the js version of ink. It allows to register a
   * callback that will be called when a variable changes. The original code uses
   * `state.variableChangedEvent += callback` instead.
   *
   * @param {function} callback
   */
  public ObserveVariableChange(
    callback: (variableName: string, newValue: InkObject) => void
  ) {
    this.variableChangedEventCallbacks.push(callback);
  }

  private _globalVariables: Map<string, InkObject>;
  private _defaultGlobalVariables: Map<string, InkObject> = new Map();

  private _callStack: CallStack;
  private _changedVariablesForBatchObs: Set<string> | null = new Set();
  private _listDefsOrigin: ListDefinitionsOrigin | null;

  private _batchObservingVariableChanges: boolean = false;
}
