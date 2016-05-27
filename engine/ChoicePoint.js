//complete
import {Object as InkObject} from './Object';
import {Path} from './Path';

export class ChoicePoint extends InkObject{
	constructor(onceOnly){
		super();
		this.pathOnChoice;
		this.hasCondition;
		this.hasStartContent;
		this.hasChoiceOnlyContent;
		this.onceOnly;
		this.isInvisibleDefault;
		
		this.onceOnly = (onceOnly === false) ? false : true;
	}
	get choiceTarget(){
		//return this.ResolvePath (pathOnChoice) as Container;
		return this.ResolvePath(this.pathOnChoice);
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
	
	toString(){
//		int? targetLineNum = DebugLineNumberOfPath (pathOnChoice);
		var targetLineNum = null;
		var targetString = pathOnChoice.toString();

		if (targetLineNum != null) {
			targetString = " line " + targetLineNum;
		} 

		return "Choice: -> " + targetString;
	}
}