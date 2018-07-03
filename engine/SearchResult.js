export class SearchResult{
	constructor(){
		this.obj;
		this.approximate;
	}

	get correctObject(){
		return this.approximate ? null : this.obj;
	}

	get container(){
		return (this.obj instanceof Container) ? this.obj : null;
	}
}