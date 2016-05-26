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
}