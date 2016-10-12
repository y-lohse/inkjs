export class Choice{
	constructor(choice){
		this.text;
		this.index;
		this.choicePoint;
		this.threadAtGeneration;
		
		this._originalThreadIndex;
		this._originalChoicePath;
		
		if (choice) this.choicePoint = choice;
	}
	get pathStringOnChoice(){
		return this.choicePoint.pathStringOnChoice;
	}
	get sourcePath(){
		return this.choicePoint.path.componentsString;
	}
}