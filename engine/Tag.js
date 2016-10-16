import {Object as InkObject} from './Object';

export class Tag extends InkObject{
	constructor(tagText){
		super();
		this._text = tagText.toString() || '';
	}
	get text(){
		return this._text;
	}
	toString(){
		return "# " + this._text;
	}
}