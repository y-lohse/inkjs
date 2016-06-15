//complete
import {StringValue} from './Value';
import {StoryException} from './StoryException';
import {Object as InkObject} from './Object';

export class Container extends InkObject{//also implements INamedContent. Not sure how to do it cleanly in JS.
	constructor(){
		super();
		this.name = '';
		
		this._content = [];
		this.namedContent = {};
		
		this.visitsShouldBeCounted = false;
		this.turnIndexShouldBeCounted = false;
		this.countingAtStartOnly = false;
		
		this.CountFlags = {
			Visits: 1,
			Turns: 2,
			CountStartOnly: 4
		};
		
		this._pathToFirstLeafContent = null;
	}
	get hasValidName(){
		return this.name != null && this.name.length > 0;
	}
	get content(){
		return this._content;
	}
	set content(value){
		this.AddContent(value);
	}
	get namedOnlyContent(){
		var namedOnlyContent = {};
		
		for (var key in this.namedContent){
			namedOnlyContent[key] = this.namedContent[key];
		}

		this.content.forEach(c => {
//			var named = c as INamedContent;
			var named = c;
			if (named.name && named.hasValidName) {
				delete namedOnlyContent[named.name];
			}
		});

		if (namedOnlyContent.length == 0)
			namedOnlyContent = null;

		return namedOnlyContent;
	}
	set namedOnlyContent(value){
		var existingNamedOnly = this.namedOnlyContent;
		if (existingNamedOnly != null) {
			for (var key in existingNamedOnly){
				delete this.namedContent[key];
			}
		}

		if (value == null)
			return;

		for (var key in value){
//			var named = kvPair.Value as INamedContent;
			var named = value[key];
			if( named.name && typeof named.hasValidName !== 'undefined' )
				this.AddToNamedContentOnly(named);
		}
	}
	get countFlags(){
		var flags = 0;
		if (this.visitsShouldBeCounted)    flags |= this.CountFlags.Visits;
		if (this.turnIndexShouldBeCounted) flags |= this.CountFlags.Turns;
		if (this.countingAtStartOnly)      flags |= this.CountFlags.CountStartOnly;

		// If we're only storing CountStartOnly, it serves no purpose,
		// since it's dependent on the other two to be used at all.
		// (e.g. for setting the fact that *if* a gather or choice's
		// content is counted, then is should only be counter at the start)
		// So this is just an optimisation for storage.
		if (flags == this.CountFlags.CountStartOnly) {
			flags = 0;
		}

		return flags;
	}
	set countFlags(value){
		 var flag = value;
		if ((flag & this.CountFlags.Visits) > 0) this.visitsShouldBeCounted = true;
		if ((flag & this.CountFlags.Turns) > 0)  this.turnIndexShouldBeCounted = true;
		if ((flag & this.CountFlags.CountStartOnly) > 0) this.countingAtStartOnly = true;
	}
	get pathToFirstLeafContent(){
		if( this._pathToFirstLeafContent == null )
			this._pathToFirstLeafContent = this.path.PathByAppendingPath(this.internalPathToFirstLeafContent);

		return this._pathToFirstLeafContent;
	}
	get internalPathToFirstLeafContent(){
		var path = new Path ();
		var container = this;
		while (container instanceof Container) {
			if (container.content.length > 0) {
				path.components.push(new Path.Component(0));
//				container = container.content [0] as Container;
				container = container.content[0];
			}
		}
		return path;
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
			this.AddToNamedContentOnly(contentObj);
		}
	}
	AddToNamedContentOnly(namedContentObj){
		if (namedContentObj instanceof InkObject === false) console.warn("Can only add Runtime.Objects to a Runtime.Container");
		namedContentObj.parent = this;

		this.namedContent[namedContentObj.name] = namedContentObj;
	}
	ContentAtPath(path, partialPathLength){
		partialPathLength = (typeof partialPathLength !== 'undefined') ? partialPathLength : path.components.length;

		var currentContainer = this;
		var currentObj = this;

		for (var i = 0; i < partialPathLength; ++i) {
			var comp = path.components[i];
			if (!(currentContainer instanceof Container))
				throw "Path continued, but previous object wasn't a container: " + currentObj;
			
			currentObj = currentContainer.ContentWithPathComponent(comp);
//			currentContainer = currentObj as Container;
			currentContainer = currentObj;
		}

		return currentObj;
	}
	InsertContent(contentObj, index){
		this.content[i] = contentObj;

		if (contentObj.parent) {
			throw "content is already in " + contentObj.parent;
		}

		contentObj.parent = this;

		this.TryAddNamedContent(contentObj);
	}
	AddContentsOfContainer(otherContainer){
		this.content = this.content.concat(otherContainer.content);
		
		otherContainer.content.forEach(obj => {
			obj.parent = this;
			this.TryAddNamedContent(obj);
		});
	}
	ContentWithPathComponent(component){
		if (component.isIndex) {

			if (component.index >= 0 && component.index < this.content.length) {
				return this.content[component.index];
			}

			// When path is out of range, quietly return nil
			// (useful as we step/increment forwards through content)
			else {
				return null;
			}

		} 

		else if (component.isParent) {
			return this.parent;
		}

		else {
			var foundContent = null;
			if (foundContent = this.namedContent[component.name]){
				return foundContent;
			}
			else {
				throw new StoryException("Content '"+component.name+"' not found at path: '"+this.path+"'");
			}
		}
	}
	BuildStringOfHierarchy(sb, indentation, pointedObj){
		if (arguments.length == 0){
			return this.BuildStringOfHierarchy('', 0, null);
		}
		
		function appendIndentation(){
			var spacesPerIndent = 4;
			for(var i = 0; i < spacesPerIndent*indentation; ++i) { 
				sb += " "; 
			}
		}

		appendIndentation();
		sb += "[";

		if (this.hasValidName) {
			sb += " (" + this.name + ")";
		}

		if (this == pointedObj) {
			sb += "  <---";
		}

		sb += "\n";

		indentation++;

		for (var i = 0; i < this.content.length; ++i) {

			var obj = this.content[i];

			if (obj instanceof Container) {

				var container = obj;

				container.BuildStringOfHierarchy(sb, indentation, pointedObj);

			} else {
				appendIndentation();
				if (obj instanceof StringValue) {
					sb += "\"";
					sb += obj.toString().replace("\n", "\\n");
					sb += "\"";
				} else {
					sb += obj.toString();
				}
			}

			if (i != this.content.length - 1) {
				sb += ",";
			}

			if ( !(obj instanceof Container) && obj == pointedObj ) {
				sb += "  <---";
			}

			sb += "\n";
		}


		var onlyNamed = {};
		
		for (var key in this.namedContent){
			if (this.content.indexOf(this.namedContent[key]) >= 0) {
				continue;
			} else {
				onlyNamed[key] = this.namedContent[key];
			}
		}

		if (Object.keys(onlyNamed).length > 0) {
			appendIndentation();
			sb += "\n";
			sb += "-- named: --";

			for (var key in onlyNamed){
				if (!(onlyNamed[key] instanceof Container)) console.warn("Can only print out named Containers");
				
				var container = onlyNamed[key];
				container.BuildStringOfHierarchy(sb, indentation, pointedObj);
				sb += "\n";
			}
		}


		indentation--;

		appendIndentation();
		sb += "]";
	}
}