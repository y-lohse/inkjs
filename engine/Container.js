export class Container{
	constructor(){
		this.name = '';
		
		this._content = [];
		this.namedContent = {};
		
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

			this.TryAddNamedContent(contentObj);
		}
	}
	TryAddNamedContent(contentObj){
		//so here, in the reference implementation, contentObj is casted to an INamedContent
		//but here we use js-style duck typing: if it implements the same props as the interface, we treat it as valid
		if (contentObj.hasValidName && contentObj.name){
			AddToNamedContentOnly(contentObj);
		}
	}
	AddToNamedContentOnly(namedContentObj){
		if (namedContentObj instanceof RuntimeObject === false) console.warn("Can only add Runtime.Objects to a Runtime.Container");
		namedContentObj.parent = this;

		this.namedContent[namedContentObj.name] = namedContentObj;
	}
}