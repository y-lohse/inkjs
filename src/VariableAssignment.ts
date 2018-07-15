import {Object as InkObject} from './Object';

export class VariableAssignment extends InkObject{

	private readonly variableName: string | null;
	private readonly isNewDeclaration: boolean;
	private isGlobal: boolean;

	constructor(variableName: string | null, isNewDeclaration: boolean){
		super();
		this.variableName = variableName || null;
		this.isNewDeclaration = !!isNewDeclaration;
		this.isGlobal = false;
	}

	public toString(): string{
		return 'VarAssign to ' + this.variableName;
	}
}
