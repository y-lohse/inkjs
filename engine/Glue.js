export class Glue{
	constructor(type){
		this.glueType = type;
	}
	get isLeft(){
		return this.glueType == GlueType.Left;
	}
	get isBi(){
		return this.glueType == GlueType.Bidirectional;
	}
	get isRight(){
		return this.glueType == GlueType.Right;
	}
	toString(){
		switch (this.glueType) {
		case GlueType.Bidirectional: return "BidirGlue";
		case GlueType.Left: return "LeftGlue";
		case GlueType.Right: return "RightGlue";
		}
		
		return "UnexpectedGlueType";
	}
}

export let GlueType = {
	Bidirectional: 0,
	Left: 1,
    Right: 2
}