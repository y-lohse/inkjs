import {Path} from './Path';

export class Choice{
	constructor(){
		this.text;
		this.index;
		this.choicePoint;
		this.threadAtGeneration;
		this.sourcePath;
		this.targetPath;
		this.isInvisibleDefault = false;

		this._originalThreadIndex;
	}
	get pathStringOnChoice(){
		return this.targetPath.toString();
	}
  set pathStringOnChoice(value){
		this.targetPath = new Path(value);
	}
}