export class Container{
	constructor(){
		this.name = '';
		
		this._content = [];
		
		this.CountFlags = {
			Visits: 1,
			Turns: 2,
			CountStartOnly: 4
		};
	}
	get content(){
		return this._content;
	}
	set content(value){
		this.AddContent(value);
	}
	AddContent(contentObj){
		if (contentObj instanceof Array){
			contentObj.forEach(c => {
				this.AddContent(c);
			});
		}
		else{
			this._content.push(contentObj);
			
			if (contentObj.parent) {
                throw "content is already in " + contentObj.parent;
            }
			
			contentObj.parent = this;

//			this.TryAddNamedContent(contentObj);
		}
	}
}