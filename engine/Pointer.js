import {Path} from 'path.js';

export class Pointer{
	constructor(container, index){
		this.container = container;
		this.index = index;
	}

	Resolve(){
		if (index < 0) return this.container;
		if (this.container == null) return null;
		if (this.container.content.length == 0) return this.container;
		if (index >= this.container.content.length) return null;

		return this.container.content[index];
	}

	get isNull(){
		return this.container == null;
	}

	get path(){
		if (this.isNull()) return null;

		if (index >= 0)
			return this.container.path.PathByAppendingComponent(new Path.Component(index));
		else
			return this.container.path;
	}

	toString(){
		if (!this.container)
			return "Ink Pointer (null)";

		return "Ink Pointer -> " + container.path.toString() + " -- index " + index;
	}

	StartOf(container){
		return new Pointer(container, 0);
	}
}

Pointer.Null = new Pointer(null, -1)
