import {AbstractValue, Value, VariablePointerValue, ListValue} from './Value';
import {VariableAssignment} from './VariableAssignment';
import {InkObject} from './Object';
import {ListDefinitionsOrigin} from './ListDefinitionsOrigin';
import {StoryException} from './StoryException';
import {JsonSerialisation} from './JsonSerialisation';
import {asOrThrows, asOrNull} from './TypeAssertion';
import {tryGetValueFromMap} from './TryGetResult';
import {throwNullException} from './NullException';
import {CallStack} from './CallStack';
import {StatePatch} from './StatePatch';

export class VariablesState{
	// The way variableChangedEvent is a bit different than the reference implementation.
	// Originally it uses the C# += operator to add delegates, but in js we need to maintain
	// an actual collection of delegates (ie. callbacks) to register a new one, there is a
	// special ObserveVariableChange method below.
	public variableChangedEventCallbacks: Array<(variableName: string, newValue: InkObject) => void> = [];
	public variableChangedEvent(variableName: string, newValue: InkObject): void {
		for (let callback of this.variableChangedEventCallbacks) {
			callback(variableName, newValue);
		}
	}

	private patch: StatePatch | null = null;

	get batchObservingVariableChanges(){
		return this._batchObservingVariableChanges;
	}
	set batchObservingVariableChanges(value: boolean){
		this._batchObservingVariableChanges = value;
		if (value) {
			this._changedVariablesForBatchObs = new Set();
		}

		else {
			if (this._changedVariablesForBatchObs != null) {
				for (let variableName of this._changedVariablesForBatchObs) {
					let currentValue = this._globalVariables.get(variableName);
					if (!currentValue) {
						throwNullException('currentValue');
					} else {
						this.variableChangedEvent(variableName, currentValue);
					}
				}

				this._changedVariablesForBatchObs = null;
			}
		}
	}

	get callStack(){
		return this._callStack;
	}
	set callStack(callStack){
		this._callStack = callStack;
	}

	private _batchObservingVariableChanges: boolean = false;

	// the original code uses a magic getter and setter for global variables,
	// allowing things like variableState['varname]. This is not quite possible
	// in js without a Proxy, so it is replaced with this $ function.
	public $(variableName: string, value: InkObject){
		if (typeof value === 'undefined'){
			let varContents = null;

			if (this.patch != null) {
				varContents = this.patch.TryGetGlobal(variableName, null);
				if (varContents.exists) return (varContents.result as AbstractValue).valueObject;
			}

			varContents = this._globalVariables.get(variableName);

			if ( typeof varContents === 'undefined' ) {
				varContents = this._defaultGlobalVariables.get(variableName);
			}

			if ( typeof varContents !== 'undefined' )
				return (varContents as AbstractValue).valueObject;
			else
				return null;
		}
		else{
			if (typeof this._defaultGlobalVariables.get(variableName) === 'undefined')
				throw new StoryException('Cannot assign to a variable ('+variableName+") that hasn't been declared in the story");

			let val = Value.Create(value);
			if (val == null) {
				if (value == null) {
					throw new StoryException('Cannot pass null to VariableState');
				} else {
					throw new StoryException('Invalid value passed to VariableState: '+value.toString());
				}
			}

			this.SetGlobal(variableName, val);
		}
	}

	constructor(callStack: CallStack, listDefsOrigin: ListDefinitionsOrigin | null){
		this._globalVariables = new Map();
		this._callStack = callStack;
		this._listDefsOrigin = listDefsOrigin;

		// if es6 proxies are available, use them.
		try{
			// the proxy is used to allow direct manipulation of global variables.
			// It first tries to access the objects own property, and if none is
			// found it delegates the call to the $ method, defined below
			let p = new Proxy(this, {
				get(target: any, name){
					return (name in target) ? target[name] : target.$(name);
				},
				set(target: any, name, value){
					if (name in target) target[name] = value;
					else target.$(name, value);
					return true; // returning a falsy value make the trap fail
				},
			});

			return p;
		}
		catch(e){
			// thr proxy object is not available in this context. we should warn the
			// dev but writting to the console feels a bit intrusive.
			// console.log("ES6 Proxy not available - direct manipulation of global variables can't work, use $() instead.");
		}
	}

	// public CopyFrom(toCopy: VariablesState){
	// 	this._globalVariables = new Map(toCopy._globalVariables);
	// 	this._defaultGlobalVariables = new Map(toCopy._defaultGlobalVariables);
	//
	// 	this.variableChangedEvent = toCopy.variableChangedEvent;
	// 	this.variableChangedEventCallbacks = toCopy.variableChangedEventCallbacks; // inkjs specificity that has to be copied along the rest of the structure
	//
	// 	if (toCopy.batchObservingVariableChanges != this.batchObservingVariableChanges) {
	//
	// 		if (toCopy.batchObservingVariableChanges) {
	// 			this._batchObservingVariableChanges = true;
	// 			if (toCopy._changedVariables === null) { return throwNullException('toCopy._changedVariables'); }
	// 			this._changedVariables = new Set(toCopy._changedVariables);
	// 		} else {
	// 			this._batchObservingVariableChanges = false;
	// 			this._changedVariables = null;
	// 		}
	// 	}
	// }

	get jsonToken(){
		return JsonSerialisation.DictionaryRuntimeObjsToJObject(this._globalVariables);
	}
	set jsonToken(value){
		this._globalVariables = JsonSerialisation.JObjectToDictionaryRuntimeObjs(value);
	}

	public TryGetDefaultVariableValue(name: string | null): InkObject | null
	{
		let val = tryGetValueFromMap(this._defaultGlobalVariables, name, null);
		return val.exists ? val.result : null;
	}

	public GlobalVariableExistsWithName(name: string){
		return this._globalVariables.has(name)  || this._defaultGlobalVariables != null && this._defaultGlobalVariables.has(name);
	}

	public GetVariableWithName(name: string | null, contextIndex: number = -1): InkObject | null {
		let varValue = this.GetRawVariableWithName(name, contextIndex);

		// var varPointer = varValue as VariablePointerValue;
		let varPointer = asOrNull(varValue, VariablePointerValue);
		if (varPointer !== null) {
			varValue = this.ValueAtVariablePointer(varPointer);
		}

		return varValue;
	}

	public GetRawVariableWithName(name: string | null, contextIndex: number) {
		let varValue: InkObject | null = null;

		if (contextIndex == 0 || contextIndex == -1) {
			let variableValue = null;
			if (this.patch != null) {
				variableValue = this.patch.TryGetGlobal(name, null);
				if (variableValue.exists) return variableValue.result as InkObject;
			}

			// this is a conditional assignment
			variableValue = tryGetValueFromMap(this._globalVariables, name, null);
			if (variableValue.exists)
				return variableValue.result;

			if (this._defaultGlobalVariables != null) {
				variableValue = tryGetValueFromMap(this._defaultGlobalVariables, name, null);
				if (variableValue.exists) return variableValue.result;
			}

			if (this._listDefsOrigin === null) return throwNullException('VariablesState._listDefsOrigin');
			let listItemValue = this._listDefsOrigin.FindSingleItemListWithName(name);
			if (listItemValue)
				return listItemValue;
		}

		varValue = this._callStack.GetTemporaryVariableWithName(name, contextIndex);

		return varValue;
	}

	public ValueAtVariablePointer(pointer: VariablePointerValue){
		 return this.GetVariableWithName(pointer.variableName, pointer.contextIndex);
	}

	public Assign(varAss: VariableAssignment, value: InkObject){
		let name = varAss.variableName;
		if (name === null) { return throwNullException('name'); }
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
				let fullyResolvedVariablePointer = this.ResolveVariablePointer(varPointer);
				value = fullyResolvedVariablePointer;
			}

		}

		else {

			let existingPointer = null;
			do {
				// existingPointer = GetRawVariableWithName (name, contextIndex) as VariablePointerValue;
				existingPointer = asOrNull(this.GetRawVariableWithName(name, contextIndex), VariablePointerValue);
				if (existingPointer != null) {
					name = existingPointer.variableName;
					contextIndex = existingPointer.contextIndex;
					setGlobal = (contextIndex == 0);
				}
			} while(existingPointer != null);
		}

		if (setGlobal) {
			this.SetGlobal(name, value);
		} else {
			this._callStack.SetTemporaryVariable(name, value, varAss.isNewDeclaration, contextIndex);
		}
	}

	public SnapshotDefaultGlobals(){
		this._defaultGlobalVariables = new Map(this._globalVariables);
	}

	public RetainListOriginsForAssignment(oldValue: InkObject, newValue: InkObject){
		let oldList = asOrThrows(oldValue, ListValue);
		let newList = asOrThrows(newValue, ListValue);

		if (oldList.value && newList.value && newList.value.Count == 0) {
			newList.value.SetInitialOriginNames(oldList.value.originNames);
		}
	}

	public SetGlobal(variableName: string | null, value: InkObject){
		let oldValue = null;

		if (this.patch == null || !this.patch.TryGetGlobal(variableName, null).exists) {
			oldValue = tryGetValueFromMap(this._globalVariables, variableName, null);
		}

		if (oldValue != null && oldValue.exists) {
			ListValue.RetainListOriginsForAssignment(oldValue.result!, value);
		}

		if (variableName === null) { return throwNullException('variableName'); }

		if (this.patch != null) {
			this.patch.SetGlobal(variableName, value);
		}
		else{
			this._globalVariables.set(variableName, value);
		}

		// TODO: Not sure !== is equivalent to !value.Equals(oldValue)
		if (this.variableChangedEvent != null && oldValue != null && value !== oldValue.result) {

			if (this.batchObservingVariableChanges) {
				if (this._changedVariablesForBatchObs === null) { return throwNullException('this._changedVariablesForBatchObs'); }

				if (this.patch != null) {
					this.patch.AddChangedVariable(variableName);
				}
				else if (this._changedVariablesForBatchObs != null) {
					this._changedVariablesForBatchObs.add(variableName);
				}
			} else {
				this.variableChangedEvent(variableName, value);
			}
		}
	}

	public ApplyPatch() {
		if (this.patch === null) { return throwNullException('this.patch'); }

		for (let [namedVarKey, namedVarValue] of this.patch.globals) {
			this._globalVariables.set(namedVarKey, namedVarValue);
		}

		if (this._changedVariablesForBatchObs != null) {
			for (let name of this.patch.changedVariables) {
				this._changedVariablesForBatchObs.add(name);
			}
		}

		this.patch = null;
	}

	public SetJsonToken(jToken: Map<string, object>){
		this._globalVariables.clear();

		for (let [varValKey, varValValue] of this._defaultGlobalVariables) {
			if (jToken.has(varValKey)) {
				let loadedToken = jToken.get(varValKey);
				let tokenInkObject = JsonSerialisation.JTokenToRuntimeObject(loadedToken);
				if (tokenInkObject === null) { return throwNullException('tokenInkObject'); }
				this._globalVariables.set(varValKey, tokenInkObject);
			}
			else {
				this._globalVariables.set(varValKey, varValValue);
			}
		}
	}

	//WriteJson
	//RuntimeObjectsEqual

	public ResolveVariablePointer(varPointer: VariablePointerValue){
		let contextIndex = varPointer.contextIndex;

		if( contextIndex == -1 )
			contextIndex = this.GetContextIndexOfVariableNamed(varPointer.variableName);

		let valueOfVariablePointedTo = this.GetRawVariableWithName(varPointer.variableName, contextIndex);

		// var doubleRedirectionPointer = valueOfVariablePointedTo as VariablePointerValue;
		let doubleRedirectionPointer = asOrNull(valueOfVariablePointedTo, VariablePointerValue);
		if (doubleRedirectionPointer != null) {
			return doubleRedirectionPointer;
		}

		else {
			return new VariablePointerValue(varPointer.variableName, contextIndex);
		}
	}

	public GetContextIndexOfVariableNamed(varName: string){
		if (this.GlobalVariableExistsWithName(varName))
			return 0;

		return this._callStack.currentElementIndex;
	}

		/**
		 * This function is specific to the js version of ink. It allows to register a
		 * callback that will be called when a variable changes. The original code uses
		 * `state.variableChangedEvent += callback` instead.
		 * @param {function} callback
		 */
	public ObserveVariableChange(callback: (variableName: string, newValue: InkObject) => void){
		this.variableChangedEventCallbacks.push(callback);
	}

	private _globalVariables: Map<string, InkObject>;
	private _defaultGlobalVariables: Map<string, InkObject> = new Map();

	private _callStack: CallStack;
	private _changedVariablesForBatchObs: Set<string> | null = new Set();
	private _listDefsOrigin: ListDefinitionsOrigin | null;
}
