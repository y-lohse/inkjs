import {Path} from './Path';
import {Container} from './Container';
import {Debug} from './Debug';
import {asOrNull, asINamedContentOrNull} from './TypeAssertion';
import { throwNullException } from './NullException';
import { SearchResult } from './SearchResult';

export class InkObject{

	public parent: InkObject | null = null;
	public _path: Path | null = null;

	get path(){
		if (this._path == null) {

			if (this.parent == null) {
				this._path = new Path();
			} else {
				// Maintain a Stack so that the order of the components
				// is reversed when they're added to the Path.
				// We're iterating up the hierarchy from the leaves/children to the root.
				const comps: Path.Component[] = [];

				let child: InkObject = this;
				let container = asOrNull(child.parent, Container);

				while (container !== null) {

					const namedChild = asINamedContentOrNull(child);
					if (namedChild != null && namedChild.hasValidName) {
						comps.unshift(new Path.Component(namedChild.name));
					} else {
						comps.unshift(new Path.Component(container.content.indexOf(child)));
					}

					child = container;
					container = asOrNull(container.parent, Container);
				}

				this._path = new Path(comps);
			}

		}

		return this._path;
	}
	get rootContentContainer(){
		let ancestor: InkObject = this;
		while (ancestor.parent) {
			ancestor = ancestor.parent;
		}
		return asOrNull(ancestor, Container);
	}

	public ResolvePath(path: Path): SearchResult{
		if (path.isRelative) {
			let nearestContainer = asOrNull(this, Container);

			if (nearestContainer === null) {
				Debug.Assert(this.parent !== null, "Can't resolve relative path because we don't have a parent");
				nearestContainer = asOrNull(this.parent, Container);
				Debug.Assert(nearestContainer !== null, 'Expected parent to be a container');
				Debug.Assert(path.GetComponent(0).isParent);
				path = path.tail;
			}

			if (nearestContainer === null) { return throwNullException('nearestContainer'); }
			return nearestContainer.ContentAtPath(path);
		} else {
			const contentContainer = this.rootContentContainer;
			if (contentContainer === null) { return throwNullException('contentContainer'); }
			return contentContainer.ContentAtPath(path);
		}
	}
	public ConvertPathToRelative(globalPath: Path){
		const ownPath = this.path;

		const minPathLength = Math.min(globalPath.length, ownPath.length);
		let lastSharedPathCompIndex = -1;

		for (let i = 0; i < minPathLength; ++i) {
			const ownComp = ownPath.GetComponent(i);
			const otherComp = globalPath.GetComponent(i);

			if (ownComp.Equals(otherComp)) {
				lastSharedPathCompIndex = i;
			} else {
				break;
			}
		}

		// No shared path components, so just use global path
		if (lastSharedPathCompIndex == -1)
			return globalPath;

		const numUpwardsMoves = (ownPath.componentCount-1) - lastSharedPathCompIndex;

		const newPathComps: Path.Component[] = [];

		for(let up = 0; up < numUpwardsMoves; ++up)
			newPathComps.push(Path.Component.ToParent());

		for (let down = lastSharedPathCompIndex + 1; down < globalPath.componentCount; ++down)
			newPathComps.push(globalPath.GetComponent(down));

		const relativePath = new Path(newPathComps, true);
		return relativePath;
	}
	public CompactPathString(otherPath: Path){
		let globalPathStr = null;
		let relativePathStr = null;

		if (otherPath.isRelative) {
			relativePathStr = otherPath.componentsString;
			globalPathStr = this.path.PathByAppendingPath(otherPath).componentsString;
		}
		else {
			const relativePath = this.ConvertPathToRelative(otherPath);
			relativePathStr = relativePath.componentsString;
			globalPathStr = otherPath.componentsString;
		}

		if (relativePathStr.length < globalPathStr.length)
			return relativePathStr;
		else
			return globalPathStr;
	}
	public Copy(){
		throw Error("Not Implemented: Doesn't support copying");
	}
	// SetChild works slightly diferently in the js implementation.
	// Since we can't pass an objets property by reference, we instead pass
	// the object and the property string.
	// TODO: This method can probably be rewritten with type-safety in mind.
	public SetChild(obj: any, prop: any, value: any){
		if (obj[prop])
			obj[prop] = null;

		obj[prop] = value;

		if( obj[prop] )
			obj[prop].parent = this;
	}
}
