//still needs: 
// - varchanged events
// - see if the internal getenumarators are needed
import {Value, VariablePointerValue} from './Value';
import {StoryException} from './StoryException';
import {JsonSerialisation} from './JsonSerialisation';

export class VariablesState{
	constructor(callStack){
		this._globalVariables = {};
		this._callStack = callStack;
		
		this._batchObservingVariableChanges = null;
		this._changedVariables = null;
		
		//the way variableChangedEvent is a bit different than the reference implementation. Originally it uses the C# += operator to add delegates, but in js we need to maintain an actual collection of delegates (ie. callbacks)
		//to register a new one, there is a special ObserveVariableChange method below.
		this.variableChangedEvent = null;
		this.variableChangedEventCallbacks = [];
		
		//if es6 proxies are available, use them.
		try{
			//the proxy is used to allow direct manipulation of global variables. It first tries to access the objetcs own property, and if none is found it delegates the call to the $ method, defined below
			var p = new Proxy(this, {
				get: function(target, name){
					return (name in target) ? target[name] : target.$(name);
				},
				set: function(target, name, value){
					if (name in target) target[name] = value;
					else target.$(name, value);
					return true;//returning a fasly value make sthe trap fail
				}
			});
			
			return p;
		}
		catch(e){
			//thr proxy object is not available in this context. we should warn the dev but writting to the console feels a bit intrusive.
//			console.log("ES6 Proxy not available - direct manipulation of global variables can't work, use $() instead.");
		}
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
			if (this._changedVariables != null) {
				this._changedVariables.forEach(variableName => {
					var currentValue = this._globalVariables[variableName];
					this.variableChangedEvent(variableName, currentValue);
				});
			}

			this._changedVariables = null;
		}
	}
	get jsonToken(){
		return JsonSerialisation.DictionaryRuntimeObjsToJObject(this._globalVariables);
	}
	set jsonToken(value){
		this._globalVariables = JsonSerialisation.JObjectToDictionaryRuntimeObjs(value);
	}
	
	/**
	 * This function is specific to the js version of ink. It allows to register a callback that will be called when a variable changes. The original code uses `state.variableChangedEvent += callback` instead.
	 * @param {function} callback 
	 */
	ObserveVariableChange(callback){
		if (this.variableChangedEvent == null){
			this.variableChangedEvent = (variableName, newValue) => {
				this.variableChangedEventCallbacks.forEach(cb => {
					cb(variableName, newValue);
				});
			};
		}
		
		this.variableChangedEventCallbacks.push(callback);
	}
	CopyFrom(varState){
		this._globalVariables = varState._globalVariables;
		this.variableChangedEvent = varState.variableChangedEvent;

		if (varState.batchObservingVariableChanges != this.batchObservingVariableChanges) {

			if (varState.batchObservingVariableChanges) {
				this._batchObservingVariableChanges = true;
				this._changedVariables = varState._changedVariables;
			} else {
				this._batchObservingVariableChanges = false;
				this._changedVariables = null;
			}
		}
	}
	GetVariableWithName(name,contextIndex){
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
	GetRawVariableWithName(name, contextIndex){
		var varValue = null;

		// 0 context = global
		if (contextIndex == 0 || contextIndex == -1) {
			if ( varValue = this._globalVariables[name] )
				return varValue;
		} 

		// Temporary
		varValue = this._callStack.GetTemporaryVariableWithName(name, contextIndex);

		if (varValue == null)
			throw "RUNTIME ERROR: Variable '"+name+"' could not be found in context '"+contextIndex+"'. This shouldn't be possible so is a bug in the ink engine. Please try to construct a minimal story that reproduces the problem and report to inkle, thank you!";

		return varValue;
	}
	ValueAtVariablePointer(pointer){
		 return this.GetVariableWithName(pointer.variableName, pointer.contextIndex);
	}
	Assign(varAss, value){
		var name = varAss.variableName;
		var contextIndex = -1;

		// Are we assigning to a global variable?
		var setGlobal = false;
		if (varAss.isNewDeclaration) {
			setGlobal = varAss.isGlobal;
		} else {
			setGlobal = !!this._globalVariables[name];
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
	SetGlobal(variableName, value){
		var oldValue = null;
		oldValue = this._globalVariables[variableName];

		this._globalVariables[variableName] = value;

		if (this.variableChangedEvent != null && value !== oldValue) {

			if (this.batchObservingVariableChanges) {
				this._changedVariables.push(variableName);
			} else {
				this.variableChangedEvent(variableName, value);
			}
		}
	}
	ResolveVariablePointer(varPointer){
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
	GetContextIndexOfVariableNamed(varName){
		if (this._globalVariables[varName])
			return 0;

		return this._callStack.currentElementIndex;
	}
	//the original code uses a magic getter and setter for global variables, allowing things like variableState['varname]. This is not quite possible in js without a Proxy, so it is replaced with this $ function.
	$(variableName, value){
		if (typeof value === 'undefined'){
			var varContents = this._globalVariables[variableName];
			if ( typeof varContents !== 'undefined' )
	//			return (varContents as Runtime.Value).valueObject;
				return varContents.valueObject;
			else
				return null;
		}
		else{
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