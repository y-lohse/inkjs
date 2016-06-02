//complete
import {Object as InkObject} from './Object';

export class Branch extends InkObject{
	constructor(trueDivert, falseDivert){
		super();
		this.trueDivert = trueDivert || null;
		this.falseDivert = falseDivert || null;
	}
	get trueDivert(){
		return this._trueDivert;
	}
	set trueDivert(value){
		this.SetChild(this, '_trueDivert', value);
	}
	get falseDivert(){
		return this._falseDivert;
	}
	set falseDivert(value){
		this.SetChild(this, '_falseDivert', value);
	}
	
	toString(){
		var sb = "";
		sb += "Branch: ";
		if (this.trueDivert) {
			sb += "(true: " + this.trueDivert + ")";
		}
		if (this.falseDivert) {
			sb += "(false: " + this.falseDivert + ")";
		}
		return sb;
	}
}