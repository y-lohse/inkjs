import {Container} from "./Container";

export class SearchResult{
	constructor(){
		this.obj;
		this.approximate;
	}

	get correctObj(){
		return this.approximate ? null : this.obj;
	}

	get container(){
		return (this.obj instanceof Container) ? this.obj : null;
	}

	copy(){
		var searchResult = new SearchResult()
		searchResult.obj = this.obj;
		searchResult.approximate = this.approximate;

		return searchResult;
	}
}
