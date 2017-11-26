import {Path} from './Path';
import {Container} from './Container';

export class Object{
	constructor(){
		this.parent = null;
		this._path = null;
	}
	get path(){
		if (this._path == null) {

			if (this.parent == null) {
				this._path = new Path();
			} else {
				// Maintain a Stack so that the order of the components
				// is reversed when they're added to the Path.
				// We're iterating up the hierarchy from the leaves/children to the root.
				var comps = [];

				var child = this;
//				Container container = child.parent as Container;
				var container = child.parent;

				while (container instanceof Container) {

					var namedChild = child;
					if (namedChild.name && namedChild.hasValidName) {
						comps.unshift(new Path.Component(namedChild.name));
					} else {
						comps.unshift(new Path.Component(container.content.indexOf(child)));
					}

					child = container;
//					container = container.parent as Container;
					container = container.parent;
				}

				this._path = new Path(comps);
			}

		}

		return this._path;
	}
	get rootContentContainer(){
		var ancestor = this;
		while (ancestor.parent) {
			ancestor = ancestor.parent;
		}
		return ancestor;
	}
	
	ResolvePath(path){
		if (path.isRelative) {
			var nearestContainer = this;

			if (nearestContainer instanceof Container === false) {
				if (this.parent == null) console.warn("Can't resolve relative path because we don't have a parent");
				
				nearestContainer = this.parent;
				if (nearestContainer.constructor.name !== 'Container') console.warn("Expected parent to be a container");
				
				//Debug.Assert (path.GetComponent(0).isParent);
				path = path.tail;
			}
			
			return nearestContainer.ContentAtPath(path);
		} else {
			return this.rootContentContainer.ContentAtPath(path);
		}
	}
	ConvertPathToRelative(globalPath){
		var ownPath = this.path;

		var minPathLength = Math.min(globalPath.componentCount, ownPath.componentCount);
		var lastSharedPathCompIndex = -1;

		for (var i = 0; i < minPathLength; ++i) {
			var ownComp = ownPath.GetComponent(i);
			var otherComp = globalPath.GetComponent(i);

			if (ownComp.Equals(otherComp)) {
				lastSharedPathCompIndex = i;
			} else {
				break;
			}
		}

		// No shared path components, so just use global path
		if (lastSharedPathCompIndex == -1)
			return globalPath;

		var numUpwardsMoves = (ownPath.componentCount-1) - lastSharedPathCompIndex;

		var newPathComps = [];

		for(var up = 0; up < numUpwardsMoves; ++up)
			newPathComps.push(Path.Component.ToParent());

		for (var down = lastSharedPathCompIndex + 1; down < globalPath.componentCount; ++down)
			newPathComps.push(globalPath.GetComponent(down));

		var relativePath = new Path(newPathComps, true);
		return relativePath;
	}
	CompactPathString(otherPath){
		var globalPathStr = null;
		var relativePathStr = null;
		
		if (otherPath.isRelative) {
			relativePathStr = otherPath.componentsString;
			globalPathStr = this.path.PathByAppendingPath(otherPath).componentsString;
		} 
		else {
			var relativePath = this.ConvertPathToRelative(otherPath);
			relativePathStr = relativePath.componentsString;
			globalPathStr = otherPath.componentsString;
		}

		if (relativePathStr.Length < globalPathStr.Length) 
			return relativePathStr;
		else
			return globalPathStr;
	}	
	Copy(){
		throw "Not Implemented";
	}
	//SetCHild works slightly diferently in the js implementation. SInce we can't pass an objets property by reference, we instead pass the object and the property string.
	SetChild(obj, prop, value){
		if (obj[prop])
			obj[prop] = null;

		obj[prop] = value;

		if( obj[prop] )
			obj[prop].parent = this;
	}
}