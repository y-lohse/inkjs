export class Tag{
	constructor(tagText){
		this._text = tagText.toString() || '';
	}
	get text(){
		return this._text;
	}
	toString(){
		return "# " + this._text;
	}
}