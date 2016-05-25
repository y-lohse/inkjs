export class VariablesState{
	constructor(callStack){
		this._globalVariables = {};
		this._callStack = callStack;
	}
}