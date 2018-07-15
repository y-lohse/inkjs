import {Object as InkObject} from './Object';
import {Path} from './Path';

export class VariableReference extends InkObject{
	constructor(name){
		super();
		this.name = name;
		this.pathForCount;
	}
	get containerForCount(){
		return this.ResolvePath(this.pathForCount).container;
	}
	get pathStringForCount(){
		if( this.pathForCount == null )
			return null;

		return this.CompactPathString(this.pathForCount);
	}
	set pathStringForCount(value){
		if (value == null)
			this.pathForCount = null;
		else
			this.pathForCount = new Path(value);
	}
	
	toString(){
		if (this.name != null) {
			return "var(" + this.name + ")";
		} else {
			var pathStr = this.pathStringForCount;
			return "read_count(" + pathStr + ")";
		}
	}
}