//complete
export class INamedContent{
	get name(){
		throw "INamedContent.name getter should be implemented in subclass";
	}
	get hasValidName(){
		throw "INamedContent.hasValidName getter should be implemented in subclass";
	}
}

