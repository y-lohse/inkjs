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
	CopyFrom(varState){
		this._globalVariables = {};
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
}