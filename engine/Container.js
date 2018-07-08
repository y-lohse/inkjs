import {StringValue} from './Value';
import {StoryException} from './StoryException';
import {StringBuilder} from './StringBuilder';
import {Object as InkObject} from './Object';
import {SearchResult} from './SearchResult';

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
		var namedOnlyContentDict = {};

		for (var key in this.namedContent){
			namedOnlyContentDict[key] = this.namedContent[key];
		}

		this.content.forEach(c => {
//			var named = c as INamedContent;
			var named = c;
			if (named.name && named.hasValidName) {
				delete namedOnlyContentDict[named.name];
			}
		});

		if (Object.keys(namedOnlyContentDict).length == 0)
			namedOnlyContentDict = null;

		return namedOnlyContentDict;
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
		var components = [];
		var container = this;
		while (container instanceof Container) {
			if (container.content.length > 0) {
				components.push(new Path.Component(0));
//				container = container.content [0] as Container;
				container = container.content[0];
			}
		}
		return new Path(components);
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
	ContentAtPath(path, partialPathStart, partialPathLength){
		partialPathStart = (typeof partialPathStart !== 'undefined') ? partialPathStart : 0;
		partialPathLength = (typeof partialPathLength !== 'undefined') ? partialPathLength : path.length;

		var result = new SearchResult();
		result.approximate = false;

		var currentContainer = this;
		var currentObj = this;

		for (var i = partialPathStart; i < partialPathLength; ++i) {
			var comp = path.GetComponent(i);
			if (currentContainer == null) {
				result.approximate = true;
				break;
			}

			var foundObj = currentContainer.ContentWithPathComponent(comp);

			if (foundObj == null || !(foundObj instanceof Container)) {
				result.approximate = true;
				break;
			}

			currentObj = foundObj
//			currentContainer = currentObj as Container;
			currentContainer = (foundObj instanceof Container) ? foundObj : null;
		}

		result.obj = currentObj;

		return result;
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
				return null;
			}
		}
	}
	BuildStringOfHierarchy(sb, indentation, pointedObj){
		if (arguments.length == 0){
			var sb = new StringBuilder();
			this.BuildStringOfHierarchy(sb, 0, null);
			return sb.toString();
		}

		function appendIndentation(){
			var spacesPerIndent = 4;
			for(var i = 0; i < spacesPerIndent*indentation; ++i) {
				sb.Append(" ");
			}
		}

		appendIndentation();
		sb.Append("[");

		if (this.hasValidName) {
			sb.AppendFormat(" ({0})", this.name);
		}

		if (this == pointedObj) {
			sb.Append("  <---");
		}

		sb.AppendLine();

		indentation++;

		for (var i = 0; i < this.content.length; ++i) {

			var obj = this.content[i];

			if (obj instanceof Container) {

				var container = obj;

				container.BuildStringOfHierarchy(sb, indentation, pointedObj);

			} else {
				appendIndentation();
				if (obj instanceof StringValue) {
					sb.Append("\"");
					sb.Append(obj.toString().replace("\n", "\\n"));
					sb.Append("\"");
				} else {
					sb.Append(obj.toString());
				}
			}

			if (i != this.content.length - 1) {
				sb.Append(",");
			}

			if ( !(obj instanceof Container) && obj == pointedObj ) {
				sb.Append("  <---");
			}

			sb.AppendLine();
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
			sb.AppendLine("-- named: --");

			for (var key in onlyNamed){
				if (!(onlyNamed[key] instanceof Container)) console.warn("Can only print out named Containers");

				var container = onlyNamed[key];
				container.BuildStringOfHierarchy(sb, indentation, pointedObj);
				sb.Append("\n");
			}
		}


		indentation--;

		appendIndentation();
		sb.Append("]");
	}
}