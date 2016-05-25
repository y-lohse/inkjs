export class Container{
	constructor(){
		this.name = '';
		
		this._content = [];
		
		this.namedContent = {};
		
		this.visitsShouldBeCounted;
		this.turnIndexShouldBeCounted;
		this.countingAtStartOnly;
		
		this.CountFlags = {
			Visits: 1,
			Turns: 2,
			CountStartOnly: 4
		};
		
		this._pathToFirstLeafContent;
	}
	getContent(){
		return this._content;
	}
	setContent(value){
		this.AddContent(value);
	}
//	namedOnlyContent(){
//		
//	}
//	countFlags(){
//		
//	}
//	hasValidName(){
//		
//	}
//	pathToFirstLeafContent(){
//		
//	}
//	internalPathToFirstLeafContent(){
//		
//	}
//	
	AddContent(contentObj){
		if (!contentObj instanceof Array){
			this._content.push(contentObj);
			
			if (contentObj.parent) {
                throw "content is already in " + contentObj.parent;
            }
			
			contentObj.parent = this;

			this.TryAddNamedContent(contentObj);
		}
		else{
			contentObj.forEach(c => {
				this.AddContent(c);
			});
		}
	}
//	InsertContent(){
//		
//	}
	TryAddNamedContent(contentObj){
//		var namedContentObj = contentObj as INamedContent;
//		if (namedContentObj != null && namedContentObj.hasValidName) {
//			AddToNamedContentOnly (namedContentObj);
//		}
	}
//	AddToNamedContentOnly(){
//		
//	}
//	AddContentsOfContainer(){
//		
//	}
//	ContentWithPathComponent(){
//		
//	}
//	ContentAtPath(){
//		
//	}
//	BuildStringOfHierarchy(){
//		
//	}
//	BuildStringOfHierarchy(){
//		//virtual
//	}
}