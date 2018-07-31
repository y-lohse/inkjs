import {AbstractValue, Value, VariablePointerValue, ListValue} from './Value';
import {VariableAssignment} from './VariableAssignment';
import {InkObject} from './Object';
import {ListDefinitionsOrigin} from './ListDefinitionsOrigin';
import {StoryException} from './StoryException';
import {JsonSerialisation} from './JsonSerialisation';
import {asOrThrows, asOrNull} from './TypeAssertion';

export class VariablesState{
    private _globalVariables: Map<string, InkObject>;
    private _defaultGlobalVariables: Map<string, InkObject>;
    private _callStack: any;
    private _listDefsOrigin: ListDefinitionsOrigin;

    private _batchObservingVariableChanges: boolean = false;
    private _changedVariables: Array<string> = [];

    //the way variableChangedEvent is a bit different than the reference implementation. Originally it uses the C# += operator to add delegates, but in js we need to maintain an actual collection of delegates (ie. callbacks)
    //to register a new one, there is a special ObserveVariableChange method below.
    variableChangedEventCallbacks: Array<(variableName: string, newValue: InkObject) => void> = [];
    variableChangedEvent(variableName: string, newValue: InkObject): void {
        this.variableChangedEventCallbacks.forEach(callback => {
            callback(variableName, newValue);
        });
    }

	constructor(callStack: any, listDefsOrigin: ListDefinitionsOrigin){
		this._globalVariables = new Map();
		this._defaultGlobalVariables = new Map();
		this._callStack = callStack;
		this._listDefsOrigin = listDefsOrigin;

		this._batchObservingVariableChanges = false;
		this._changedVariables = [];

		// TODO should we discourage the use of proxies since they're non-portable and direct access is unsafe?
		//if es6 proxies are available, use them.
		try{
			//the proxy is used to allow direct manipulation of global variables. It first tries to access the objects own property, and if none is found it delegates the call to the $ method, defined below
			var p = new Proxy(this, {
				get: function(target: any, name){
					return (name in target) ? target[name] : target.$(name);
				},
				set: function(target: any, name, value){
					if (name in target) target[name] = value;
					else target.$(name, value);
					return true;//returning a falsy value make the trap fail
				}
			});

			return p;
		}
		catch(e){
			//thr proxy object is not available in this context. we should warn the dev but writting to the console feels a bit intrusive.
            //console.log("ES6 Proxy not available - direct manipulation of global variables can't work, use $() instead.");
        }
    }


	get callStack(){
		return this._callStack;
	}
	set callStack(callStack){
		this._callStack = callStack;
	}
	get batchObservingVariableChanges(){
		return this._batchObservingVariableChanges;
	}
	set batchObservingVariableChanges(value){
		value = !!value;
		this._batchObservingVariableChanges = value;
		if (value) {
			this._changedVariables = [];
		}

		// Finished observing variables in a batch - now send
		// notifications for changed variables all in one go.
		else {
		    this._changedVariables.forEach(variableName => {
                var currentValue = this._globalVariables.get(variableName);
                this.variableChangedEvent(variableName, currentValue as InkObject);
		    });
		}
	}
	get jsonToken(){
		return JsonSerialisation.DictionaryRuntimeObjsToJObject(this._globalVariables);
	}
	set jsonToken(value){
        this._globalVariables = JsonSerialisation.JObjectToDictionaryRuntimeObjs(value) as Map<string, InkObject>; // TODO remove the `as` after JsonSerialisation is ported
	}

	/**
	 * This function is specific to the js version of ink. It allows to register a callback that will be called when a variable changes. The original code uses `state.variableChangedEvent += callback` instead.
	 * @param {function} callback
	 */
    ObserveVariableChange(callback: (variableName: string, newValue: InkObject) => void){
		this.variableChangedEventCallbacks.push(callback);
	}

	CopyFrom(toCopy: VariablesState){
		this._globalVariables = Object.assign({}, toCopy._globalVariables);
		this._defaultGlobalVariables = Object.assign({}, toCopy._defaultGlobalVariables);

		this.variableChangedEvent = toCopy.variableChangedEvent;

		if (toCopy.batchObservingVariableChanges != this.batchObservingVariableChanges) {

			if (toCopy.batchObservingVariableChanges) {
				this._batchObservingVariableChanges = true;
				this._changedVariables = toCopy._changedVariables;
			} else {
				this._batchObservingVariableChanges = false;
				this._changedVariables = [];
			}
		}
	}
	GlobalVariableExistsWithName(name: string){
		return typeof this._globalVariables.get(name) !== 'undefined';
	}
	GetVariableWithName(name: string,contextIndex: number): InkObject {
		if (typeof contextIndex === 'undefined') contextIndex = -1;

		var varValue = this.GetRawVariableWithName(name, contextIndex);

		// Get value from pointer?
//		var varPointer = varValue as VariablePointerValue;
		var varPointer = varValue;
		if (varPointer instanceof VariablePointerValue) {
			varValue = this.ValueAtVariablePointer(varPointer);
		}

		return varValue;
	}
	TryGetDefaultVariableValue (name: string): InkObject | null
	{
		let val = asOrNull(this._defaultGlobalVariables.get(name), InkObject);
		return val;
	}
	GetRawVariableWithName(name: string, contextIndex: number){
		var varValue = null;

		// 0 context = global
		if (contextIndex == 0 || contextIndex == -1) {
            // TODO this is a conditional assignment
			if ( varValue = this._globalVariables.get(name) )
				return varValue;

			var listItemValue = this._listDefsOrigin.FindSingleItemListWithName(name);
			if (listItemValue)
				return listItemValue;
		}

		// Temporary
		varValue = this._callStack.GetTemporaryVariableWithName(name, contextIndex);

		return varValue;
	}
	ValueAtVariablePointer(pointer: VariablePointerValue){
		 return this.GetVariableWithName(pointer.variableName, pointer.contextIndex);
	}
	Assign(varAss: VariableAssignment, value: InkObject){
		let name = varAss.variableName as string;
		var contextIndex = -1;

		// Are we assigning to a global variable?
		var setGlobal = false;
		if (varAss.isNewDeclaration) {
			setGlobal = varAss.isGlobal;
		} else {
			setGlobal = !!this._globalVariables.get(name);
		}

		// Constructing new variable pointer reference
		if (varAss.isNewDeclaration) {
//			var varPointer = value as VariablePointerValue;
			var varPointer = value;
			if (varPointer instanceof VariablePointerValue) {
				var fullyResolvedVariablePointer = this.ResolveVariablePointer(varPointer);
				value = fullyResolvedVariablePointer;
			}

		}

		// Assign to existing variable pointer?
		// Then assign to the variable that the pointer is pointing to by name.
		else {

			// De-reference variable reference to point to
			var existingPointer = null;
			do {
//				existingPointer = GetRawVariableWithName (name, contextIndex) as VariablePointerValue;
				existingPointer = this.GetRawVariableWithName(name, contextIndex);
				if (existingPointer instanceof VariablePointerValue) {
					name = existingPointer.variableName;
					contextIndex = existingPointer.contextIndex;
					setGlobal = (contextIndex == 0);
				}
			} while(existingPointer instanceof VariablePointerValue);
		}


		if (setGlobal) {
			this.SetGlobal(name, value);
		} else {
			this._callStack.SetTemporaryVariable(name, value, varAss.isNewDeclaration, contextIndex);
		}
	}

	SnapshotDefaultGlobals(){
		this._defaultGlobalVariables = Object.assign({}, this._globalVariables);
	}

	RetainListOriginsForAssignment(oldValue: InkObject, newValue: InkObject){
		var oldList = asOrThrows(oldValue, ListValue);
		var newList = asOrThrows(newValue, ListValue);

        if (oldList.value && newList.value && newList.value.Count == 0) {
			newList.value.SetInitialOriginNames(oldList.value.originNames);
        }
	}
	SetGlobal(variableName: string, value: InkObject){
		let oldValue = asOrNull(this._globalVariables.get(variableName), InkObject);

        if (oldValue) {
            ListValue.RetainListOriginsForAssignment(oldValue, value);
        }

		this._globalVariables.set(variableName, value);

		if (this.variableChangedEvent != null && value !== oldValue) {

			if (this.batchObservingVariableChanges) {
				this._changedVariables.push(variableName);
			} else {
				this.variableChangedEvent(variableName, value);
			}
		}
	}
	ResolveVariablePointer(varPointer: VariablePointerValue){
		var contextIndex = varPointer.contextIndex;

		if( contextIndex == -1 )
			contextIndex = this.GetContextIndexOfVariableNamed(varPointer.variableName);

		var valueOfVariablePointedTo = this.GetRawVariableWithName(varPointer.variableName, contextIndex);

		// Extra layer of indirection:
		// When accessing a pointer to a pointer (e.g. when calling nested or
		// recursive functions that take a variable references, ensure we don't create
		// a chain of indirection by just returning the final target.
//		var doubleRedirectionPointer = valueOfVariablePointedTo as VariablePointerValue;
		var doubleRedirectionPointer = valueOfVariablePointedTo;
		if (doubleRedirectionPointer instanceof VariablePointerValue) {
			return doubleRedirectionPointer;
		}

		// Make copy of the variable pointer so we're not using the value direct from
		// the runtime. Temporary must be local to the current scope.
		else {
			return new VariablePointerValue(varPointer.variableName, contextIndex);
		}
	}
	GetContextIndexOfVariableNamed(varName: string){
		if (this._globalVariables.get(varName))
			return 0;

		return this._callStack.currentElementIndex;
	}
	//the original code uses a magic getter and setter for global variables, allowing things like variableState['varname]. This is not quite possible in js without a Proxy, so it is replaced with this $ function.
	$(variableName: string, value: InkObject){
		if (typeof value === 'undefined'){
			var varContents = this._globalVariables.get(variableName);

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
				throw new StoryException("Cannot assign to a variable that hasn't been declared in the story");

			var val = Value.Create(value);
			if (val == null) {
				if (value == null) {
					throw new StoryException("Cannot pass null to VariableState");
				} else {
					throw new StoryException("Invalid value passed to VariableState: "+value.toString());
				}
			}

			this.SetGlobal(variableName, val);
		}
	}
}
