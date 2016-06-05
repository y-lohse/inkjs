//still needs: 
// - varchanged events
// - see if the internal getenumarators are needed
import {Value, VariablePointerValue} from './Value';
import {JsonSerialisation as Json} from './JsonSerialisation';

export class VariablesState{
	constructor(callStack){
		this._globalVariables = {};
		this._callStack = callStack;
		
		this._batchObservingVariableChanges;
	}
	get batchObservingVariableChanges(){
		return this._batchObservingVariableChanges;
	}
	set batchObservingVariableChanges(value){
		value = !!value;
		this._batchObservingVariableChanges = value;
		if (value) {
			this._changedVariables = {};
		} 

		// Finished observing variables in a batch - now send 
		// notifications for changed variables all in one go.
		else {
			if (this._changedVariables != null) {
				for (var variableName in this._changedVariables) {
					var currentValue = this._globalVariables[variableName];
					variableChangedEvent(variableName, currentValue);
				}
			}

			this._changedVariables = null;
		}
	}
	get jsonToken(){
		return Json.DictionaryRuntimeObjsToJObject(this._globalVariables);
	}
	set jsonToken(value){
		this._globalVariables = Json.JObjectToDictionaryRuntimeObjs(value);
	}
	
	CopyFrom(varState){
		this._globalVariables = varState._globalVariables;
		this.variableChangedEvent = varState.variableChangedEvent;

		if (varState.batchObservingVariableChanges != this.batchObservingVariableChanges) {

			if (varState.batchObservingVariableChanges) {
				this._batchObservingVariableChanges = true;
				this._changedVariables = {};
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
	$(variableName, value){
		if (typeof value === 'undefined'){
			var varContents = this._globalVariables[variableName];
			console.log(varContents.valueObject);
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
					throw "Cannot pass null to VariableState";
				} else {
					throw "Invalid value passed to VariableState: "+value.toString();
				}
			}

			this.SetGlobal(variableName, val);
		}
	}
}