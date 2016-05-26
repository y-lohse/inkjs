export class Object{
	constructor(){
		this.parent = null;
		this._path = null;
	}
//	get path(){
//		
//	}
	get rootContentContainer(){
		var ancestor = this;
		while (ancestor.parent) {
			ancestor = ancestor.parent;
		}
		return ancestor;
	}
	
//	ResolvePath(){
//		
//	}
//	ConvertPathToRelative(){
//		
//	}
//	CompactPathString(){
//		
//	}	
//	Copy(){
//		throw "Not Implemented";
//	}
//	SetChild(){
//		
//	}
}