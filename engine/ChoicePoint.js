import {Object as InkObject} from './Object';
import {Path} from './Path';

export class ChoicePoint extends InkObject{
	constructor(onceOnly){
		super();
		this._pathOnChoice;
		this.hasCondition;
		this.hasStartContent;
		this.hasChoiceOnlyContent;
		this.onceOnly;
		this.isInvisibleDefault;
		
		this.onceOnly = !!onceOnly;
	}
	get pathOnChoice(){
		if (this._pathOnChoice != null && this._pathOnChoice.isRelative) {
			var choiceTargetObj = this.choiceTarget;
			if (choiceTargetObj) {
				this._pathOnChoice = choiceTargetObj.path;
			}
		}
		return this._pathOnChoice;
	}
	get choiceTarget(){
		//return this.ResolvePath (_pathOnChoice) as Container;
		return this.ResolvePath(this._pathOnChoice);
	}
	get pathStringOnChoice(){
		return this.CompactPathString(this.pathOnChoice);
	}
	set pathStringOnChoice(value){
		this.pathOnChoice = new Path(value);
	}
	get flags(){
		var flags = 0;
		if (this.hasCondition)         flags |= 1;
		if (this.hasStartContent)      flags |= 2;
		if (this.hasChoiceOnlyContent) flags |= 4;
		if (this.isInvisibleDefault)   flags |= 8;
		if (this.onceOnly)             flags |= 16;
		return flags;
	}
	set flags(value){
		this.hasCondition = (value & 1) > 0;
		this.hasStartContent = (value & 2) > 0;
		this.hasChoiceOnlyContent = (value & 4) > 0;
		this.isInvisibleDefault = (value & 8) > 0;
		this.onceOnly = (value & 16) > 0;
	}
	set pathOnChoice(value){
		this._pathOnChoice = value;
	}
	
	toString(){
//		int? targetLineNum = DebugLineNumberOfPath (pathOnChoice);
		var targetLineNum = null;
		var targetString = this.pathOnChoice.toString();

		if (targetLineNum != null) {
			targetString = " line " + targetLineNum;
		} 

		return "Choice: -> " + targetString;
	}
}