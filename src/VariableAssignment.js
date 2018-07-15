import {Object as InkObject} from './Object';

export class VariableAssignment extends InkObject{
	constructor(variableName, isNewDeclaration){
		super();
		this._variableName = variableName || null;
		this._isNewDeclaration = !!isNewDeclaration;
		this.isGlobal;
	}
	get variableName(){
		return this._variableName;
	}
	get isNewDeclaration(){
		return this._isNewDeclaration;
	}
	
	toString(){
		return "VarAssign to " + this.variableName;;
	}
}