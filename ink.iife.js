(function (exports) {
	'use strict';

	//complete
	class Path$1 {
		constructor() /*polymorphic constructor*/{
			this.isRelative;
			this._components = [];

			if (arguments.length == 2) {
				this._components.push(arguments[0]);
				this._components = this._components.concat(arguments[1]);
			} else if (arguments.length == 1 && typeof arguments[0] == 'string') {
				this.componentsString = arguments[0];
			} else if (arguments.length == 1 && arguments[0] instanceof Array) {
				this._components = this._components.concat(arguments[0]);
			}
		}
		get components() {
			return this._components;
		}
		get head() {
			if (this.components.length > 0) {
				return this.components[0];
			} else {
				return null;
			}
		}
		get tail() {
			if (this.components.length >= 2) {
				var tailComps = this.components.slice(1, this.components.length); //careful, the original code uses length-1 here. This is because the second argument of List.GetRange is a number of elements to extract, wherease Array.slice uses an index
				return new Path$1(tailComps);
			} else {
				return Path$1.self;
			}
		}
		get length() {
			return this.components.length;
		}
		get lastComponent() {
			if (this.components.length > 0) {
				return this.components[this.components.length - 1];
			} else {
				return null;
			}
		}
		get containsNamedComponent() {
			for (var i = 0, l = this.components.length; i < l; i++) {
				if (!this.components[i].isIndex) {
					return true;
				}
			}
			return false;
		}
		static get self() {
			var path = new Path$1();
			path.isRelative = true;
			return path;
		}

		PathByAppendingPath(pathToAppend) {
			var p = new Path$1();

			var upwardMoves = 0;
			for (var i = 0; i < pathToAppend.components.length; ++i) {
				if (pathToAppend.components[i].isParent) {
					upwardMoves++;
				} else {
					break;
				}
			}

			for (var i = 0; i < this.components.length - upwardMoves; ++i) {
				p.components.push(this.components[i]);
			}

			for (var i = upwardMoves; i < pathToAppend.components.length; ++i) {
				p.components.push(pathToAppend.components[i]);
			}

			return p;
		}
		get componentsString() {
			var compsStr = this.components.join(".");
			if (this.isRelative) return "." + compsStr;else return compsStr;
		}
		set componentsString(value) {
			this.components.length = 0;

			var componentsStr = value;

			// When components start with ".", it indicates a relative path, e.g.
			//   .^.^.hello.5
			// is equivalent to file system style path:
			//  ../../hello/5
			if (componentsStr[0] == '.') {
				this.isRelative = true;
				componentsStr = componentsStr.substring(1);
			}

			var componentStrings = componentsStr.split('.');
			componentStrings.forEach(str => {
				if (!isNaN(parseInt(str))) {
					this.components.push(new Component(parseInt(str)));
				} else {
					this.components.push(new Component(str));
				}
			});
		}
		toString() {
			return this.componentsString;
		}
		Equals(otherPath) {
			if (otherPath == null) return false;

			if (otherPath.components.length != this.components.length) return false;

			if (otherPath.isRelative != this.isRelative) return false;

			return otherPath.components == this.components; //originally uses SequenceEqual, not sure this achieves the same
		}
	}

	class Component {
		constructor(indexOrName) {
			if (typeof indexOrName == 'string') {
				this._index = -1;
				this._name = indexOrName;
			} else {
				this._index = parseInt(indexOrName);
				this._name = null;
			}
		}
		get index() {
			return this._index;
		}
		get name() {
			return this._name;
		}
		get isIndex() {
			return this.index >= 0;
		}
		get isParent() {
			return this.name == Path$1.parentId;
		}

		ToParent() {
			return new Component(Path$1.parentId);
		}
		toString() {
			if (this.isIndex) {
				return this.index.toString();
			} else {
				return this.name;
			}
		}
		Equals(otherComp) {
			if (otherComp != null && otherComp.isIndex == this.isIndex) {
				if (isIndex) {
					return index == otherComp.index;
				} else {
					return name == otherComp.name;
				}
			}

			return false;
		}
	}

	Path$1.parentId = "^";
	Path$1.Component = Component;

	class InkObject {
		constructor() {
			this.parent = null;
			this._path = null;
		}
		get path() {
			if (this._path == null) {

				if (this.parent == null) {
					this._path = new Path$1();
				} else {
					// Maintain a Stack so that the order of the components
					// is reversed when they're added to the Path.
					// We're iterating up the hierarchy from the leaves/children to the root.
					var comps = [];

					var child = this;
					//				Container container = child.parent as Container;
					var container = child.parent;

					while (container) {

						var namedChild = child;
						if (namedChild.name && namedChild.hasValidName) {
							comps.unshift(new Path$1.Component(namedChild.name));
						} else {
							comps.unshift(new Path$1.Component(container.content.indexOf(child)));
						}

						child = container;
						//					container = container.parent as Container;
						container = container.parent;
					}

					this._path = new Path$1(comps);
				}
			}

			return this._path;
		}
		get rootContentContainer() {
			var ancestor = this;
			while (ancestor.parent) {
				ancestor = ancestor.parent;
			}
			return ancestor;
		}

		ResolvePath(path) {
			if (path.isRelative) {
				var nearestContainer = this;
				//originally here, nearestContainer is a cast of this to a Container.
				//however, importing Container here creates a circular dep. Th best I can think of right now is to test the constructor name, which is likely to break in case of inheritance., but I don't think containers are extended.

				if (nearestContainer.constructor.name !== 'Container') {
					if (this.parent == null) console.warn("Can't resolve relative path because we don't have a parent");

					nearestContainer = this.parent;
					if (nearestContainer.constructor.name !== 'Container') console.warn("Expected parent to be a container");

					//Debug.Assert (path.components [0].isParent);
					path = path.tail;
				}

				return nearestContainer.ContentAtPath(path);
			} else {
				return this.rootContentContainer.ContentAtPath(path);
			}
		}
		ConvertPathToRelative(globalPath) {
			var ownPath = this.path;

			var minPathLength = Math.min(globalPath.components.length, ownPath.components.length);
			var lastSharedPathCompIndex = -1;

			for (var i = 0; i < minPathLength; ++i) {
				var ownComp = ownPath.components[i];
				var otherComp = globalPath.components[i];

				if (ownComp.Equals(otherComp)) {
					lastSharedPathCompIndex = i;
				} else {
					break;
				}
			}

			// No shared path components, so just use global path
			if (lastSharedPathCompIndex == -1) return globalPath;

			var numUpwardsMoves = ownPath.components.length - 1 - lastSharedPathCompIndex;

			var newPathComps = [];

			for (var up = 0; up < numUpwardsMoves; ++up) newPathComps.push(Path$1.Component.ToParent());

			for (var down = lastSharedPathCompIndex + 1; down < globalPath.components.length; ++down) newPathComps.push(globalPath.components[down]);

			var relativePath = new Path$1(newPathComps);
			relativePath.isRelative = true;
			return relativePath;
		}
		CompactPathString(otherPath) {
			var globalPathStr = null;
			var relativePathStr = null;

			if (otherPath.isRelative) {
				relativePathStr = otherPath.componentsString;
				globalPathStr = this.path.PathByAppendingPath(otherPath).componentsString;
			} else {
				var relativePath = this.ConvertPathToRelative(otherPath);
				relativePathStr = relativePath.componentsString;
				globalPathStr = otherPath.componentsString;
			}

			if (relativePathStr.Length < globalPathStr.Length) return relativePathStr;else return globalPathStr;
		}
		Copy() {
			throw "Not Implemented";
		}
		//SetCHild works slightly diferently in the js implementation. SInce we can't pass an objets property by reference, we instead pass the object and the property string.
		SetChild(obj, prop, value) {
			if (obj[prop]) obj[prop] = null;

			obj[prop] = value;

			if (obj[prop]) obj[prop].parent = this;
		}
	}

	class Container extends InkObject {
		//also implements INamedContent. Not sure how to do it cleanly in JS.
		constructor() {
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
		get hasValidName() {
			return this.name != null && this.name.length > 0;
		}
		get content() {
			return this._content;
		}
		set content(value) {
			this.AddContent(value);
		}
		get namedOnlyContent() {
			var namedOnlyContent = {};

			for (var key in this.namedContent) {
				namedOnlyContent[key] = this.namedContent[key];
			}

			this.content.forEach(c => {
				//			var named = c as INamedContent;
				var named = c;
				if (named.name && named.hasValidName) {
					delete namedOnlyContent[named.name];
				}
			});

			if (namedOnlyContent.length == 0) namedOnlyContent = null;

			return namedOnlyContent;
		}
		set namedOnlyContent(value) {
			var existingNamedOnly = this.namedOnlyContent;
			if (existingNamedOnly != null) {
				for (var key in existingNamedOnly) {
					delete this.namedContent[key];
				}
			}

			if (value == null) return;

			for (var key in value) {
				//			var named = kvPair.Value as INamedContent;
				var named = value[key];
				if (named.name && typeof named.hasValidName !== 'undefined') this.AddToNamedContentOnly(named);
			}
		}
		get countFlags() {
			var flags = 0;
			if (this.visitsShouldBeCounted) flags |= this.CountFlags.Visits;
			if (this.turnIndexShouldBeCounted) flags |= this.CountFlags.Turns;
			if (this.countingAtStartOnly) flags |= this.CountFlags.CountStartOnly;

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
		set countFlags(value) {
			var flag = value;
			if ((flag & this.CountFlags.Visits) > 0) this.visitsShouldBeCounted = true;
			if ((flag & this.CountFlags.Turns) > 0) this.turnIndexShouldBeCounted = true;
			if ((flag & this.CountFlags.CountStartOnly) > 0) this.countingAtStartOnly = true;
		}
		get pathToFirstLeafContent() {
			if (this._pathToFirstLeafContent == null) this._pathToFirstLeafContent = this.path.PathByAppendingPath(this.internalPathToFirstLeafContent);

			return this._pathToFirstLeafContent;
		}
		get internalPathToFirstLeafContent() {
			var path = new Path();
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

		AddContent(contentObj) {
			if (contentObj instanceof Array) {
				contentObj.forEach(c => {
					this.AddContent(c);
				});
			} else {
				this._content.push(contentObj);

				if (contentObj.parent) {
					throw "content is already in " + contentObj.parent;
				}

				contentObj.parent = this;

				this.TryAddNamedContent(contentObj);
			}
		}
		TryAddNamedContent(contentObj) {
			//so here, in the reference implementation, contentObj is casted to an INamedContent
			//but here we use js-style duck typing: if it implements the same props as the interface, we treat it as valid
			if (contentObj.hasValidName && contentObj.name) {
				this.AddToNamedContentOnly(contentObj);
			}
		}
		AddToNamedContentOnly(namedContentObj) {
			if (namedContentObj instanceof InkObject === false) console.warn("Can only add Runtime.Objects to a Runtime.Container");
			namedContentObj.parent = this;

			this.namedContent[namedContentObj.name] = namedContentObj;
		}
		ContentAtPath(path, partialPathLength) {
			partialPathLength = typeof partialPathLength !== 'undefined' ? partialPathLength : path.components.length;

			var currentContainer = this;
			var currentObj = this;

			for (var i = 0; i < partialPathLength; ++i) {
				var comp = path.components[i];
				if (!(currentContainer instanceof Container)) throw "Path continued, but previous object wasn't a container: " + currentObj;

				currentObj = currentContainer.ContentWithPathComponent(comp);
				//			currentContainer = currentObj as Container;
				currentContainer = currentObj;
			}

			return currentObj;
		}
		InsertContent(contentObj, index) {
			this.content[i] = contentObj;

			if (contentObj.parent) {
				throw "content is already in " + contentObj.parent;
			}

			contentObj.parent = this;

			this.TryAddNamedContent(contentObj);
		}
		AddContentsOfContainer(otherContainer) {
			this.content = this.content.concat(otherContainer.content);

			otherContainer.content.forEach(obj => {
				obj.parent = this;
				this.TryAddNamedContent(obj);
			});
		}
		ContentWithPathComponent(component) {
			if (component.isIndex) {

				if (component.index >= 0 && component.index < this.content.length) {
					return this.content[component.index];
				}

				// When path is out of range, quietly return nil
				// (useful as we step/increment forwards through content)
				else {
						return null;
					}
			} else if (component.isParent) {
				return this.parent;
			} else {
				var foundContent = null;
				if (foundContent = this.namedContent[component.name]) {
					return foundContent;
				} else {
					throw "Content '" + component.name + "' not found at path: '" + this.path + "'";
				}
			}
		}
		BuildStringOfHierarchy(sb, indentation, pointedObj) {
			if (arguments.length == 0) {
				return this.BuildStringOfHierarchy('', 0, null);
			}

			function appendIndentation() {
				var spacesPerIndent = 4;
				for (var i = 0; i < spacesPerIndent * indentation; ++i) {
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

				if (!(obj instanceof Container) && obj == pointedObj) {
					sb += "  <---";
				}

				sb += "\n";
			}

			var onlyNamed = {};

			for (var key in this.namedContent) {
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

				for (var key in onlyNamed) {
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

	var ValueType = {
		// Used in coersion
		Int: 0,
		Float: 1,
		String: 2,

		// Not used for coersion described above
		DivertTarget: 3,
		VariablePointer: 4
	};

	class Value extends InkObject {
		constructor(val) {
			super();
			this._value = val;
			this._valueType;
			this._isTruthy;
			this._valueObject;
		}
		get value() {
			return this._value;
		}
		set value(value) {
			this._value = value;
		}
		get valueType() {
			return this._valueType;
		}
		get isTruthy() {
			return this._isTruthy;
		}
		get valueObject() {
			return this._valueObject;
		}

		Cast(newType) {
			throw "Cast to " + newType + "not implemented";
		}
		Copy(val) {
			return this.Create(val);
		}
		toString() {
			return this.value.toString();
		}
		static Create(val) {
			// Implicitly convert bools into ints
			if (val instanceof Boolean) {
				var b = !!val;
				val = b ? 1 : 0;
			}

			if (Number.isInteger(Number(val))) {
				return new IntValue(val);
			} else if (!isNaN(val)) {
				return new FloatValue(val);
			} else if (val instanceof String) {
				return new StringValue$1(val);
			} else if (val instanceof Path$1) {
				return new DivertTargetValue$1(val);
			}

			return null;
		}
	}

	class IntValue extends Value {
		constructor(val) {
			super(val || 0);
			this._valueType = ValueType.Int;
		}
		get isTruthy() {
			return this.value != 0;
		}
		get valueType() {
			return ValueType.Int;
		}

		Cast(newType) {
			if (newType == this.valueType) {
				return this;
			}

			if (newType == ValueType.Float) {
				return new FloatValue(parseFloat(this.value));
			}

			if (newType == ValueType.String) {
				return new StringValue$1("" + this.value);
			}

			throw "Unexpected type cast of Value to new ValueType";
		}
	}

	class FloatValue extends Value {
		constructor(val) {
			super(val || 0.0);
			this._valueType = ValueType.Float;
		}
		get isTruthy() {
			return this._value != 0.0;
		}
		get valueType() {
			return ValueType.Float;
		}

		Cast(newType) {
			if (newType == this.valueType) {
				return this;
			}

			if (newType == ValueType.Int) {
				return new IntValue(parseInt(this.value));
			}

			if (newType == ValueType.String) {
				return new StringValue$1("" + this.value);
			}

			throw "Unexpected type cast of Value to new ValueType";
		}
	}

	class StringValue$1 extends Value {
		constructor(val) {
			super(val || '');
			this._valueType = ValueType.String;

			this._isNewline = this.value == "\n";
			this._isInlineWhitespace = true;

			this.value.split().every(c => {
				if (c != ' ' && c != '\t') {
					this._isInlineWhitespace = false;
					return false;
				}

				return true;
			});
		}
		get valueType() {
			return ValueType.String;
		}
		get isTruthy() {
			return this.value.length > 0;
		}
		get isNewline() {
			return this._isNewline;
		}
		get isInlineWhitespace() {
			return this._isInlineWhitespace;
		}
		get isNonWhitespace() {
			return !this.isNewline && !this.isInlineWhitespace;
		}

		Cast(newtType) {
			if (newType == this.valueType) {
				return this;
			}

			if (newType == ValueType.Int) {

				var parsedInt;
				if (parsedInt = parseInt(value)) {
					return new IntValue(parsedInt);
				} else {
					return null;
				}
			}

			if (newType == ValueType.Float) {
				var parsedFloat;
				if (parsedFloat = parsedFloat(value)) {
					return new FloatValue(parsedFloat);
				} else {
					return null;
				}
			}

			throw "Unexpected type cast of Value to new ValueType";
		}
	}

	class DivertTargetValue$1 extends Value {
		constructor(targetPath) {
			super(targetPath);

			this._valueType = ValueType.DivertTarget;
		}
		get targetPath() {
			return this.value;
		}
		set targetPath(value) {
			this.value = value;
		}
		get isTruthy() {
			throw "Shouldn't be checking the truthiness of a divert target";
		}

		Cast(newType) {
			if (newType == this.valueType) return this;

			throw "Unexpected type cast of Value to new ValueType";
		}
		toString() {
			return "DivertTargetValue(" + this.targetPath + ")";
		}
	}

	//@TODO: we should probably not extend StringValue here, because all teh calls to instanceof StringValue will be truthy for VariablePointerValues, which shouldn't be the case
	class VariablePointerValue extends StringValue$1 {
		constructor(variableName, contextIndex) {
			super(variableName);

			this._valueType = ValueType.VariablePointer;
			this.contextIndex = typeof contextIndex !== 'undefined' ? contextIndex : -1;
		}
		get variableName() {
			return this.value;
		}
		set variableName(value) {
			this.value = value;
		}
		get isTruthy() {
			throw "Shouldn't be checking the truthiness of a variable pointer";
		}

		Cast(newType) {
			if (newType == this.valueType) return this;

			throw "Unexpected type cast of Value to new ValueType";
		}
		toString() {
			return "VariablePointerValue(" + this.variableName + ")";
		}
		Copy() {
			return new VariablePointerValue(this.variableName, this.contextIndex);
		}
	}

	//complete
	class Glue {
		constructor(type) {
			this.glueType = type;
		}
		get isLeft() {
			return this.glueType == GlueType.Left;
		}
		get isBi() {
			return this.glueType == GlueType.Bidirectional;
		}
		get isRight() {
			return this.glueType == GlueType.Right;
		}
		toString() {
			switch (this.glueType) {
				case GlueType.Bidirectional:
					return "BidirGlue";
				case GlueType.Left:
					return "LeftGlue";
				case GlueType.Right:
					return "RightGlue";
			}

			return "UnexpectedGlueType";
		}
	}

	let GlueType = {
		Bidirectional: 0,
		Left: 1,
		Right: 2
	};

	class ControlCommand extends InkObject {
		constructor(commandType) {
			super();
			this._commandType = typeof commandType != 'undefined' ? commandType : CommandType.NotSet;
		}
		get commandType() {
			return this._commandType;
		}
		copy() {
			return new ControlCommand(this.commandType);
		}
		toString() {
			return this.commandType.toString();
		}
		static EvalStart() {
			return new ControlCommand(CommandType.EvalStart);
		}
		static EvalOutput() {
			return new ControlCommand(CommandType.EvalOutput);
		}
		static EvalEnd() {
			return new ControlCommand(CommandType.EvalEnd);
		}
		static Duplicate() {
			return new ControlCommand(CommandType.Duplicate);
		}
		static PopEvaluatedValue() {
			return new ControlCommand(CommandType.PopEvaluatedValue);
		}
		static PopFunction() {
			return new ControlCommand(CommandType.PopFunction);
		}
		static PopTunnel() {
			return new ControlCommand(CommandType.PopTunnel);
		}
		static BeginString() {
			return new ControlCommand(CommandType.BeginString);
		}
		static EndString() {
			return new ControlCommand(CommandType.EndString);
		}
		static NoOp() {
			return new ControlCommand(CommandType.NoOp);
		}
		static ChoiceCount() {
			return new ControlCommand(CommandType.ChoiceCount);
		}
		static TurnsSince() {
			return new ControlCommand(CommandType.TurnsSince);
		}
		static VisitIndex() {
			return new ControlCommand(CommandType.VisitIndex);
		}
		static SequenceShuffleIndex() {
			return new ControlCommand(CommandType.SequenceShuffleIndex);
		}
		static StartThread() {
			return new ControlCommand(CommandType.StartThread);
		}
		static Done() {
			return new ControlCommand(CommandType.Done);
		}
		static End() {
			return new ControlCommand(CommandType.End);
		}
	}

	var CommandType = {
		NotSet: -1,
		EvalStart: 0,
		EvalOutput: 1,
		EvalEnd: 2,
		Duplicate: 3,
		PopEvaluatedValue: 4,
		PopFunction: 5,
		PopTunnel: 6,
		BeginString: 7,
		EndString: 8,
		NoOp: 9,
		ChoiceCount: 10,
		TurnsSince: 11,
		VisitIndex: 12,
		SequenceShuffleIndex: 13,
		StartThread: 14,
		Done: 15,
		End: 16
	};
	CommandType.TOTAL_VALUES = Object.keys(CommandType).length - 1; //-1 because NotSet shoudn't count
	ControlCommand.CommandType = CommandType;

	//complete
	let PushPopType$1 = {
		Tunnel: 0,
		Function: 1
	};

	class Divert extends InkObject {
		constructor(stackPushType) {
			super();
			this._targetPath;
			this._targetContent;

			this.variableDivertName;
			this.pushesToStack;
			this.stackPushType;

			this.isExternal;
			this.externalArgs;

			//actual constructor
			this.pushesToStack = false;
			if (stackPushType) {
				this.pushesToStack = true;
				this.stackPushType = stackPushType;
			}
		}
		get targetPath() {
			// Resolve any relative paths to global ones as we come across them
			if (this._targetPath != null && this._targetPath.isRelative) {
				var targetObj = this.targetContent;
				if (targetObj) {
					this._targetPath = targetObj.path;
				}
			}

			return this._targetPath;
		}
		set targetPath(value) {
			this._targetPath = value;
			this._targetContent = null;
		}
		get targetContent() {
			if (this._targetContent == null) {
				this._targetContent = this.ResolvePath(this._targetPath);
			}

			return this._targetContent;
		}
		get targetPathString() {
			if (this.targetPath == null) return null;

			return this.CompactPathString(this.targetPath);
		}
		set targetPathString(value) {
			if (value == null) {
				this.targetPath = null;
			} else {
				this.targetPath = new Path$1(value);
			}
		}
		get hasVariableTarget() {
			return this.variableDivertName != null;
		}

		Equals(obj) {
			//		var otherDivert = obj as Divert;
			var otherDivert = obj;
			if (otherDivert instanceof Divert) {
				if (this.hasVariableTarget == otherDivert.hasVariableTarget) {
					if (this.hasVariableTarget) {
						return this.variableDivertName == otherDivert.variableDivertName;
					} else {
						return this.targetPath.Equals(otherDivert.targetPath);
					}
				}
			}
			return false;
		}
		toString() {
			if (this.hasVariableTarget) {
				return "Divert(variable: " + this.variableDivertName + ")";
			} else if (targetPath == null) {
				return "Divert(null)";
			} else {

				var sb = '';

				var targetStr = this.targetPath.toString();
				//			int? targetLineNum = DebugLineNumberOfPath (targetPath);
				var targetLineNum = null;
				if (targetLineNum != null) {
					targetStr = "line " + targetLineNum;
				}

				sb += "Divert";
				if (this.pushesToStack) {
					if (stackPushType == PushPopType.Function) {
						sb += " function";
					} else {
						sb += " tunnel";
					}
				}

				sb += " (";
				sb += targetStr;
				sb += ")";

				return sb;
			}
		}
	}

	class ChoicePoint extends InkObject {
		constructor(onceOnly) {
			super();
			this.pathOnChoice;
			this.hasCondition;
			this.hasStartContent;
			this.hasChoiceOnlyContent;
			this.onceOnly;
			this.isInvisibleDefault;

			this.onceOnly = onceOnly === false ? false : true;
		}
		get choiceTarget() {
			//return this.ResolvePath (pathOnChoice) as Container;
			return this.ResolvePath(this.pathOnChoice);
		}
		get pathStringOnChoice() {
			return this.CompactPathString(this.pathOnChoice);
		}
		set pathStringOnChoice(value) {
			this.pathOnChoice = new Path$1(value);
		}
		get flags() {
			var flags = 0;
			if (this.hasCondition) flags |= 1;
			if (this.hasStartContent) flags |= 2;
			if (this.hasChoiceOnlyContent) flags |= 4;
			if (this.isInvisibleDefault) flags |= 8;
			if (this.onceOnly) flags |= 16;
			return flags;
		}
		set flags(value) {
			this.hasCondition = (value & 1) > 0;
			this.hasStartContent = (value & 2) > 0;
			this.hasChoiceOnlyContent = (value & 4) > 0;
			this.isInvisibleDefault = (value & 8) > 0;
			this.onceOnly = (value & 16) > 0;
		}

		toString() {
			//		int? targetLineNum = DebugLineNumberOfPath (pathOnChoice);
			var targetLineNum = null;
			var targetString = pathOnChoice.toString();

			if (targetLineNum != null) {
				targetString = " line " + targetLineNum;
			}

			return "Choice: -> " + targetString;
		}
	}

	class VariableReference extends InkObject {
		constructor(name) {
			super();
			this.name = name;
			this.pathForCount;
		}
		get containerForCount() {
			return this.ResolvePath(this.pathForCount);
		}
		get pathStringForCount() {
			if (this.pathForCount == null) return null;

			return this.CompactPathString(this.pathForCount);
		}
		set pathStringForCount(value) {
			if (value == null) this.pathForCount = null;else this.pathForCount = new Path$1(value);
		}

		toString() {
			if (this.name != null) {
				return "var(" + this.name + ")";
			} else {
				var pathStr = this.pathStringForCount;
				return "read_count(" + pathStr + ")";
			}
		}
	}

	class VariableAssignment extends InkObject {
		constructor(variableName, isNewDeclaration) {
			super();
			this._variableName = variableName || null;
			this._isNewDeclaration = !!isNewDeclaration;
			this.isGlobal;
		}
		get variableName() {
			return this._variableName;
		}
		get isNewDeclaration() {
			return this._isNewDeclaration;
		}

		toString() {
			return "VarAssign to " + this.variableName;;
		}
	}

	class Void extends InkObject {}

	class NativeFunctionCall extends InkObject {
		constructor(name) {
			super();
			this.name = name;
			this._numberOfParameters;

			this._prototype;
			this._isPrototype;
			this._operationFuncs = null;

			NativeFunctionCall.GenerateNativeFunctionsIfNecessary();
		}
		get name() {
			return this._name;
		}
		set name(value) {
			this._name = value;
			if (!this._isPrototype) this._prototype = NativeFunctionCall._nativeFunctions[this._name];
		}
		get numberOfParameters() {
			if (this._prototype) {
				return this._prototype.numberOfParameters;
			} else {
				return this._numberOfParameters;
			}
		}
		set numberOfParameters(value) {
			this._numberOfParameters = value;
		}

		static internalConstructor(name, numberOfParamters) {
			var nativeFunc = new NativeFunctionCall(name);
			nativeFunc._isPrototype = true;
			nativeFunc.numberOfParameters = numberOfParamters;
			return nativeFunc;
		}
		static CallWithName(functionName) {
			return new NativeFunctionCall(functionName);
		}
		static CallExistsWithName(functionName) {
			this.GenerateNativeFunctionsIfNecessary();
			return this._nativeFunctions[functionName];
		}
		Call(parameters) {
			if (this._prototype) {
				return this._prototype.Call(parameters);
			}

			if (this.numberOfParameters != parameters.length) {
				throw "Unexpected number of parameters";
			}

			parameters.forEach(p => {
				if (p instanceof Void) throw "Attempting to perform operation on a void value. Did you forget to 'return' a value from a function you called here?";
			});

			var coercedParams = this.CoerceValuesToSingleType(parameters);
			var coercedType = coercedParams[0].valueType;

			//Originally CallType gets a type parameter taht is used to do some casting, but we can do without.
			if (coercedType == ValueType.Int) {
				return this.CallType(coercedParams);
			} else if (coercedType == ValueType.Float) {
				return this.CallType(coercedParams);
			} else if (coercedType == ValueType.String) {
				return this.CallType(coercedParams);
			} else if (coercedType == ValueType.DivertTarget) {
				return this.CallType(coercedParams);
			}

			return null;
		}
		CallType(parametersOfSingleType) {
			var param1 = parametersOfSingleType[0];
			var valType = param1.valueType;

			var val1 = param1;

			var paramCount = parametersOfSingleType.length;

			if (paramCount == 2 || paramCount == 1) {

				var opForTypeObj = this._operationFuncs[valType];
				if (!opForTypeObj) {
					throw "Can not perform operation '" + this.name + "' on " + valType;
				}

				// Binary
				if (paramCount == 2) {
					var param2 = parametersOfSingleType[1];

					var val2 = param2;

					var opForType = opForTypeObj;

					// Return value unknown until it's evaluated
					var resultVal = opForType(val1.value, val2.value);

					return Value.Create(resultVal);
				}

				// Unary
				else {

						var opForType = opForTypeObj;

						var resultVal = opForType(val1.value);

						return Value.Create(resultVal);
					}
			} else {
				throw "Unexpected number of parameters to NativeFunctionCall: " + parametersOfSingleType.length;
			}
		}
		CoerceValuesToSingleType(parametersIn) {
			var valType = ValueType.Int;

			// Find out what the output type is
			// "higher level" types infect both so that binary operations
			// use the same type on both sides. e.g. binary operation of
			// int and float causes the int to be casted to a float.
			parametersIn.forEach(obj => {
				var val = obj;
				if (val.valueType > valType) {
					valType = val.valueType;
				}
			});

			// Coerce to this chosen type
			var parametersOut = [];
			parametersIn.forEach(val => {
				var castedValue = val.Cast(valType);
				parametersOut.push(castedValue);
			});

			return parametersOut;
		}
		static GenerateNativeFunctionsIfNecessary() {
			if (this._nativeFunctions == null) {
				this._nativeFunctions = {};

				// Int operations
				this.AddIntBinaryOp(this.Add, (x, y) => {
					return x + y;
				});
				this.AddIntBinaryOp(this.Subtract, (x, y) => {
					return x - y;
				});
				this.AddIntBinaryOp(this.Multiply, (x, y) => {
					return x * y;
				});
				this.AddIntBinaryOp(this.Divide, (x, y) => {
					return x / y;
				});
				this.AddIntBinaryOp(this.Mod, (x, y) => {
					return x % y;
				});
				this.AddIntUnaryOp(this.Negate, x => {
					return -x;
				});

				this.AddIntBinaryOp(this.Equal, (x, y) => {
					return x == y ? 1 : 0;
				});
				this.AddIntBinaryOp(this.Greater, (x, y) => {
					return x > y ? 1 : 0;
				});
				this.AddIntBinaryOp(this.Less, (x, y) => {
					return x < y ? 1 : 0;
				});
				this.AddIntBinaryOp(this.GreaterThanOrEquals, (x, y) => {
					return x >= y ? 1 : 0;
				});
				this.AddIntBinaryOp(this.LessThanOrEquals, (x, y) => {
					return x <= y ? 1 : 0;
				});
				this.AddIntBinaryOp(this.NotEquals, (x, y) => {
					return x != y ? 1 : 0;
				});
				this.AddIntUnaryOp(this.Not, x => {
					return x == 0 ? 1 : 0;
				});

				this.AddIntBinaryOp(this.And, (x, y) => {
					return x != 0 && y != 0 ? 1 : 0;
				});
				this.AddIntBinaryOp(this.Or, (x, y) => {
					return x != 0 || y != 0 ? 1 : 0;
				});

				this.AddIntBinaryOp(this.Max, (x, y) => {
					return Math.max(x, y);
				});
				this.AddIntBinaryOp(this.Min, (x, y) => {
					return Math.min(x, y);
				});

				// Float operations
				this.AddFloatBinaryOp(this.Add, (x, y) => {
					return x + y;
				});
				this.AddFloatBinaryOp(this.Subtract, (x, y) => {
					return x - y;
				});
				this.AddFloatBinaryOp(this.Multiply, (x, y) => {
					return x * y;
				});
				this.AddFloatBinaryOp(this.Divide, (x, y) => {
					return x / y;
				});
				this.AddFloatBinaryOp(this.Mod, (x, y) => {
					return x % y;
				}); // TODO: Is this the operation we want for floats?
				this.AddFloatUnaryOp(this.Negate, x => {
					return -x;
				});

				this.AddFloatBinaryOp(this.Equal, (x, y) => {
					return x == y ? 1 : 0;
				});
				this.AddFloatBinaryOp(this.Greater, (x, y) => {
					return x > y ? 1 : 0;
				});
				this.AddFloatBinaryOp(this.Less, (x, y) => {
					return x < y ? 1 : 0;
				});
				this.AddFloatBinaryOp(this.GreaterThanOrEquals, (x, y) => {
					return x >= y ? 1 : 0;
				});
				this.AddFloatBinaryOp(this.LessThanOrEquals, (x, y) => {
					return x <= y ? 1 : 0;
				});
				this.AddFloatBinaryOp(this.NotEquals, (x, y) => {
					return x != y ? 1 : 0;
				});
				this.AddFloatUnaryOp(this.Not, x => {
					return x == 0.0 ? 1 : 0;
				});

				this.AddFloatBinaryOp(this.And, (x, y) => {
					return x != 0.0 && y != 0.0 ? 1 : 0;
				});
				this.AddFloatBinaryOp(this.Or, (x, y) => {
					return x != 0.0 || y != 0.0 ? 1 : 0;
				});

				this.AddFloatBinaryOp(this.Max, (x, y) => {
					return Math.max(x, y);
				});
				this.AddFloatBinaryOp(this.Min, (x, y) => {
					return Math.min(x, y);
				});

				// String operations
				this.AddStringBinaryOp(this.Add, (x, y) => {
					return x + y;
				}); // concat
				this.AddStringBinaryOp(this.Equal, (x, y) => {
					return x === y ? 1 : 0;
				});

				// Special case: The only operation you can do on divert target values
				var divertTargetsEqual = (d1, d2) => {
					return d1.Equals(d2) ? 1 : 0;
				};
				this.AddOpToNativeFunc(this.Equal, 2, ValueType.DivertTarget, divertTargetsEqual);
			}
		}
		AddOpFuncForType(valType, op) {
			if (this._operationFuncs == null) {
				this._operationFuncs = {};
			}

			this._operationFuncs[valType] = op;
		}
		static AddOpToNativeFunc(name, args, valType, op) {
			var nativeFunc = this._nativeFunctions[name];
			if (!nativeFunc) {
				nativeFunc = NativeFunctionCall.internalConstructor(name, args);
				this._nativeFunctions[name] = nativeFunc;
			}

			nativeFunc.AddOpFuncForType(valType, op);
		}

		static AddIntBinaryOp(name, op) {
			this.AddOpToNativeFunc(name, 2, ValueType.Int, op);
		}
		static AddIntUnaryOp(name, op) {
			this.AddOpToNativeFunc(name, 1, ValueType.Int, op);
		}

		static AddFloatBinaryOp(name, op) {
			this.AddOpToNativeFunc(name, 2, ValueType.Float, op);
		}
		static AddFloatUnaryOp(name, op) {
			this.AddOpToNativeFunc(name, 1, ValueType.Float, op);
		}

		static AddStringBinaryOp(name, op) {
			this.AddOpToNativeFunc(name, 2, ValueType.String, op);
		}

		toString() {
			return "Native '" + this.name + "'";
		}
	}

	NativeFunctionCall.Add = "+";
	NativeFunctionCall.Subtract = "-";
	NativeFunctionCall.Divide = "/";
	NativeFunctionCall.Multiply = "*";
	NativeFunctionCall.Mod = "%";
	NativeFunctionCall.Negate = "~";

	NativeFunctionCall.Equal = "==";
	NativeFunctionCall.Greater = ">";
	NativeFunctionCall.Less = "<";
	NativeFunctionCall.GreaterThanOrEquals = ">=";
	NativeFunctionCall.LessThanOrEquals = "<=";
	NativeFunctionCall.NotEquals = "!=";
	NativeFunctionCall.Not = "!";

	NativeFunctionCall.And = "&&";
	NativeFunctionCall.Or = "||";

	NativeFunctionCall.Min = "MIN";
	NativeFunctionCall.Max = "MAX";

	NativeFunctionCall._nativeFunctions = null;

	class Branch extends InkObject {
		constructor(trueDivert, falseDivert) {
			super();
			this.trueDivert = trueDivert || null;
			this.falseDivert = falseDivert || null;
		}
		get trueDivert() {
			return this._trueDivert;
		}
		set trueDivert(value) {
			this.SetChild(this, '_trueDivert', value);
		}
		get falseDivert() {
			return this._falseDivert;
		}
		set falseDivert(value) {
			this.SetChild(this, '_falseDivert', value);
		}

		toString() {
			var sb = "";
			sb += "Branch: ";
			if (this.trueDivert) {
				sb += "(true: " + this.trueDivert + ")";
			}
			if (this.falseDivert) {
				sb += "(false: " + this.falseDivert + ")";
			}
			return sb;
		}
	}

	class Json$1 {
		static ListToJArray(serialisables) {
			var jArray = [];
			serialisables.forEach(s => {
				jArray.push(this.RuntimeObjectToJToken(s));
			});
			return jArray;
		}
		static JArrayToRuntimeObjList(jArray, skipLast) {
			var count = jArray.length;
			if (skipLast) count--;

			var list = [];

			for (var i = 0; i < count; i++) {
				var jTok = jArray[i];
				var runtimeObj = this.JTokenToRuntimeObject(jTok);
				list.push(runtimeObj);
			}

			return list;
		}
		static JObjectToDictionaryRuntimeObjs(jObject) {
			var dict = {};

			for (var key in jObject) {
				dict[key] = this.JTokenToRuntimeObject(jObject[key]);
			}

			return dict;
		}
		static JObjectToIntDictionary(jObject) {
			var dict = {};
			for (var key in jObject) {
				dict[key] = parseInt(jObject[key]);
			}
			return dict;
		}
		static DictionaryRuntimeObjsToJObject(dictionary) {
			var jsonObj = {};

			for (var key in dictionary) {
				//			var runtimeObj = keyVal.Value as Runtime.Object;
				var runtimeObj = dictionary[key];
				if (runtimeObj instanceof InkObject) jsonObj[key] = this.RuntimeObjectToJToken(runtimeObj);
			}

			return jsonObj;
		}
		static IntDictionaryToJObject(dict) {
			var jObj = new {}();
			for (var key in dict) {
				jObj[key] = dict[key];
			}
			return jObj;
		}
		static JTokenToRuntimeObject(token) {
			//@TODO probably find a more robust way to detect numbers, isNaN seems happy to accept things that really aren't numberish.
			if (!isNaN(token) && token !== "\n") {
				//JS thinks "\n" is a number
				return Value.Create(token);
			}

			if (typeof token === 'string') {
				var str = token.toString();

				// String value
				var firstChar = str[0];
				if (firstChar == '^') return new StringValue$1(str.substring(1));else if (firstChar == "\n" && str.length == 1) return new StringValue$1("\n");

				// Glue
				if (str == "<>") return new Glue(GlueType.Bidirectional);else if (str == "G<") return new Glue(GlueType.Left);else if (str == "G>") return new Glue(GlueType.Right);

				// Control commands (would looking up in a hash set be faster?)
				for (var i = 0; i < _controlCommandNames.length; ++i) {
					var cmdName = _controlCommandNames[i];
					if (str == cmdName) {
						return new ControlCommand(i);
					}
				}

				// Native functions
				if (NativeFunctionCall.CallExistsWithName(str)) return NativeFunctionCall.CallWithName(str);

				// Pop
				if (str == "->->") return ControlCommand.PopTunnel();else if (str == "~ret") return ControlCommand.PopFunction();

				// Void
				if (str == "void") return new Void();
			}

			if (typeof token === 'object' && token instanceof Array === false) {
				var obj = token;
				var propValue;

				// Divert target value to path
				if (obj["^->"]) {
					propValue = obj["^->"];
					return new DivertTargetValue(new Path(propValue.toString()));
				}

				// VariablePointerValue
				if (obj["^var"]) {
					propValue = obj["^var"];
					var varPtr = new VariablePointerValue(propValue.toString());
					if (obj["ci"]) {
						propValue = obj["ci"];
						varPtr.contextIndex = parseInt(propValue);
					}
					return varPtr;
				}

				// Divert
				var isDivert = false;
				var pushesToStack = false;
				var divPushType = PushPopType$1.Function;
				var external = false;
				if (propValue = obj["->"]) {
					isDivert = true;
				} else if (propValue = obj["f()"]) {
					isDivert = true;
					pushesToStack = true;
					divPushType = PushPopType$1.Function;
				} else if (propValue = obj["->t->"]) {
					isDivert = true;
					pushesToStack = true;
					divPushType = PushPopType$1.Tunnel;
				} else if (propValue = obj["x()"]) {
					isDivert = true;
					external = true;
					pushesToStack = false;
					divPushType = PushPopType$1.Function;
				}

				if (isDivert) {
					var divert = new Divert();
					divert.pushesToStack = pushesToStack;
					divert.stackPushType = divPushType;
					divert.isExternal = external;

					var target = propValue.toString();

					if (propValue = obj["var"]) divert.variableDivertName = target;else divert.targetPathString = target;

					if (external) {
						if (propValue = obj["exArgs"]) divert.externalArgs = parseInt(propValue);
					}

					return divert;
				}

				// Choice
				if (propValue = obj["*"]) {
					var choice = new ChoicePoint();
					choice.pathStringOnChoice = propValue.toString();

					if (propValue = obj["flg"]) choice.flags = parseInt(propValue);

					return choice;
				}

				// Variable reference
				if (propValue = obj["VAR?"]) {
					return new VariableReference(propValue.toString());
				} else if (propValue = obj["CNT?"]) {
					var readCountVarRef = new VariableReference();
					readCountVarRef.pathStringForCount = propValue.toString();
					return readCountVarRef;
				}

				// Variable assignment
				var isVarAss = false;
				var isGlobalVar = false;
				if (propValue = obj["VAR="]) {
					isVarAss = true;
					isGlobalVar = true;
				} else if (propValue = obj["temp="]) {
					isVarAss = true;
					isGlobalVar = false;
				}
				if (isVarAss) {
					var varName = propValue.toString();
					var isNewDecl = !obj["re"];
					var varAss = new VariableAssignment(varName, isNewDecl);
					varAss.isGlobal = isGlobalVar;
					return varAss;
				}

				var trueDivert = null;
				var falseDivert = null;
				if (propValue = obj["t?"]) {
					//				trueDivert = JTokenToRuntimeObject(propValue) as Divert;
					trueDivert = this.JTokenToRuntimeObject(propValue);
				}
				if (propValue = obj["f?"]) {
					//				falseDivert = JTokenToRuntimeObject(propValue) as Divert;
					falseDivert = this.JTokenToRuntimeObject(propValue);
				}
				if (trueDivert instanceof Divert || falseDivert instanceof Divert) {
					return new Branch(trueDivert, falseDivert);
				}

				if (obj["originalChoicePath"] != null) return this.JObjectToChoice(obj);
			}

			// Array is always a Runtime.Container
			if (token instanceof Array) {
				return this.JArrayToContainer(token);
			}

			if (token == null) return null;

			throw "Failed to convert token to runtime object: " + JSON.stringify(token);
		}
		static JArrayToContainer(jArray) {
			var container = new Container();
			container.content = this.JArrayToRuntimeObjList(jArray, true);

			// Final object in the array is always a combination of
			//  - named content
			//  - a "#" key with the countFlags
			// (if either exists at all, otherwise null)
			//		var terminatingObj = jArray [jArray.Count - 1] as JObject;
			var terminatingObj = jArray[jArray.length - 1];
			if (terminatingObj != null) {

				var namedOnlyContent = {};

				for (var key in terminatingObj) {
					if (key == "#f") {
						container.countFlags = parseInt(terminatingObj[key]);
					} else if (key == "#n") {
						container.name = terminatingObj[key].toString();
					} else {
						var namedContentItem = this.JTokenToRuntimeObject(terminatingObj[key]);
						//					var namedSubContainer = namedContentItem as Container;
						var namedSubContainer = namedContentItem;
						if (namedSubContainer instanceof Container) namedSubContainer.name = key;
						namedOnlyContent[key] = namedContentItem;
					}
				}

				container.namedOnlyContent = namedOnlyContent;
			}

			return container;
		}
	}

	var _controlCommandNames = [];

	_controlCommandNames[ControlCommand.CommandType.EvalStart] = "ev";
	_controlCommandNames[ControlCommand.CommandType.EvalOutput] = "out";
	_controlCommandNames[ControlCommand.CommandType.EvalEnd] = "/ev";
	_controlCommandNames[ControlCommand.CommandType.Duplicate] = "du";
	_controlCommandNames[ControlCommand.CommandType.PopEvaluatedValue] = "pop";
	_controlCommandNames[ControlCommand.CommandType.PopFunction] = "~ret";
	_controlCommandNames[ControlCommand.CommandType.PopTunnel] = "->->";
	_controlCommandNames[ControlCommand.CommandType.BeginString] = "str";
	_controlCommandNames[ControlCommand.CommandType.EndString] = "/str";
	_controlCommandNames[ControlCommand.CommandType.NoOp] = "nop";
	_controlCommandNames[ControlCommand.CommandType.ChoiceCount] = "choiceCnt";
	_controlCommandNames[ControlCommand.CommandType.TurnsSince] = "turns";
	_controlCommandNames[ControlCommand.CommandType.VisitIndex] = "visit";
	_controlCommandNames[ControlCommand.CommandType.SequenceShuffleIndex] = "seq";
	_controlCommandNames[ControlCommand.CommandType.StartThread] = "thread";
	_controlCommandNames[ControlCommand.CommandType.Done] = "done";
	_controlCommandNames[ControlCommand.CommandType.End] = "end";

	for (var i$1 = 0; i$1 < ControlCommand.CommandType.TOTAL_VALUES; ++i$1) {
		if (_controlCommandNames[i$1] == null) throw "Control command not accounted for in serialisation";
	}

	class Element {
		constructor(type, container, contentIndex, inExpressionEvaluation) {
			this.currentContainer = container;
			this.currentContentIndex = contentIndex;
			this.inExpressionEvaluation = inExpressionEvaluation || false;
			this.temporaryVariables = {};
			this.type = type;
		}
		get currentObject() {
			if (this.currentContainer && this.currentContentIndex < this.currentContainer.content.length) {
				return this.currentContainer.content[this.currentContentIndex];
			}

			return null;
		}
		set currentObject(value) {
			var currentObj = value;
			if (currentObj == null) {
				this.currentContainer = null;
				this.currentContentIndex = 0;
				return;
			}

			//		currentContainer = currentObj.parent as Container;
			this.currentContainer = currentObj.parent;
			if (this.currentContainer instanceof Container) this.currentContentIndex = this.currentContainer.content.indexOf(currentObj);

			// Two reasons why the above operation might not work:
			//  - currentObj is already the root container
			//  - currentObj is a named container rather than being an object at an index
			if (this.currentContainer instanceof Container === false || this.currentContentIndex == -1) {
				//			currentContainer = currentObj as Container;
				this.currentContainer = currentObj;
				this.currentContentIndex = 0;
			}
		}
		Copy() {
			var copy = new Element(this.type, this.currentContainer, this.currentContentIndex, this.inExpressionEvaluation);
			Object.assign(copy.temporaryVariables, this.temporaryVariables);
			return copy;
		}
	}

	class Thread {
		constructor(jsonToken, storyContext) {
			this.callstack = [];
			this.threadIndex = 0;

			if (jsonToken && storyContext) {
				var jThreadObj = jsonToken;
				this.threadIndex = parseInt(jThreadObj["threadIndex"]);

				var jThreadCallstack = jThreadObj["callstack"];

				jThreadCallstack.forEach(jElTok => {
					var jElementObj = jElTok;

					var pushPopType = parseInt(jElementObj["type"]);

					var currentContainer = null;
					var contentIndex = 0;

					var currentContainerPathStr = null;
					var currentContainerPathStrToken;
					if (currentContainerPathStrToken = jElementObj["cPath"]) {
						currentContainerPathStr = currentContainerPathStrToken.toString();
						//					currentContainer = storyContext.ContentAtPath (new Path(currentContainerPathStr)) as Container;
						currentContainer = storyContext.ContentAtPath(new Path$1(currentContainerPathStr));
						contentIndex = parseInt(jElementObj["idx"]);
					}

					var inExpressionEvaluation = !!jElementObj["exp"];

					var el = new Element(pushPopType, currentContainer, contentIndex, inExpressionEvaluation);

					var jObjTemps = jElementObj["temp"];
					el.temporaryVariables = Json$1.JObjectToDictionaryRuntimeObjs(jObjTemps);

					this.callstack.push(el);
				});
			}
		}
		get jsonToken() {
			var threadJObj = {};

			var jThreadCallstack = [];
			this.callstack.forEach(el => {
				var jObj = {};
				if (el.currentContainer) {
					jObj["cPath"] = el.currentContainer.path.componentsString;
					jObj["idx"] = el.currentContentIndex;
				}
				jObj["exp"] = el.inExpressionEvaluation;
				jObj["type"] = parseInt(el.type);
				jObj["temp"] = Json$1.DictionaryRuntimeObjsToJObject(el.temporaryVariables);
				jThreadCallstack.push(jObj);
			});

			threadJObj["callstack"] = jThreadCallstack;
			threadJObj["threadIndex"] = threadIndex;

			return threadJObj;
		}
		Copy() {
			var copy = new Thread();
			copy.threadIndex = this.threadIndex;
			this.callstack.forEach(e => {
				copy.callstack.push(e.Copy());
			});
			return copy;
		}
	}

	class CallStack {
		constructor(copyOrrootContentContainer) {
			this._threads = [];
			this._threadCounter = 0;
			this._threads.push(new Thread());

			if (copyOrrootContentContainer instanceof CallStack) {
				this._threads = [];

				copyOrrootContentContainer._threads.forEach(otherThread => {
					this._threads.push(otherThread.Copy());
				});
			} else {
				this._threads[0].callstack.push(new Element(PushPopType$1.Tunnel, copyOrrootContentContainer, 0));
			}
		}
		get currentThread() {
			return this._threads[this._threads.length - 1];
		}
		set currentThread(value) {
			if (this._threads.length != 1) console.warn("Shouldn't be directly setting the current thread when we have a stack of them");

			this._threads.length = 0;
			this._threads.push(value);
		}
		get callStack() {
			return this.currentThread.callstack;
		}
		get elements() {
			return this.callStack;
		}
		get currentElement() {
			return this.callStack[this.callStack.length - 1];
		}
		get currentElementIndex() {
			return this.callStack.length - 1;
		}
		get canPop() {
			return this.callStack.length > 1;
		}
		get canPopThread() {
			return this._threads.length > 1;
		}

		CanPop(type) {
			if (!this.canPop) return false;

			if (type == null) return true;

			return this.currentElement.type == type;
		}
		Pop(type) {
			if (this.CanPop(type)) {
				this.callStack.pop();
				return;
			} else {
				console.error("Mismatched push/pop in Callstack");
			}
		}
		Push(type) {
			// When pushing to callstack, maintain the current content path, but jump out of expressions by default
			this.callStack.push(new Element(type, this.currentElement.currentContainer, this.currentElement.currentContentIndex, false));
		}
		PushThread() {
			var newThread = this.currentThread.Copy();
			newThread.threadIndex = this._threadCounter;
			this._threadCounter++;
			this._threads.push(newThread);
		}
		PopThread() {
			if (this.canPopThread) {
				this._threads.splice(this.currentThread, 1); //should be equivalent to a pop()
			} else {
					console.error("Can't pop thread");
				}
		}
		SetJsonToken(token, storyContext) {
			this._threads.length = 0;

			var jObject = token;

			var jThreads = jObject["threads"];

			jThreads.forEach(jThreadTok => {
				var thread = new Thread(jThreadTok, storyContext);
				this._threads.push(thread);
			});

			this._threadCounter = parseInt(jObject["threadCounter"]);
		}
		GetJsonToken() {
			var jObject = {};

			var jThreads = [];
			this._threads.forEach(thread => {
				jThreads.push(thread.jsonToken);
			});

			jObject["threads"] = jThreads;
			jObject["threadCounter"] = this._threadCounter;

			return jObject;
		}
		GetTemporaryVariableWithName(name, contextIndex) {
			contextIndex = typeof contextIndex === 'undefined' ? -1 : contextIndex;

			if (contextIndex == -1) contextIndex = this.currentElementIndex;

			var varValue = null;

			var contextElement = this.callStack[contextIndex];

			if (varValue = contextElement.temporaryVariables[name]) {
				return varValue;
			} else {
				return null;
			}
		}
		SetTemporaryVariable(name, value, declareNew, contextIndex) {
			contextIndex = typeof contextIndex === 'undefined' ? -1 : contextIndex;

			if (contextIndex == -1) contextIndex = this.currentElementIndex;

			var contextElement = this.callStack[contextIndex];

			if (!declareNew && !contextElement.temporaryVariables[name]) {
				throw "Could not find temporary variable to set: " + name;
			}

			contextElement.temporaryVariables[name] = value;
		}
		ContextForVariableNamed(name) {
			// Current temporary context?
			// (Shouldn't attempt to access contexts higher in the callstack.)
			if (this.currentElement.temporaryVariables[name]) {
				return this.currentElementIndex;
			}

			// Global
			else {
					return -1;
				}
		}
		ThreadWithIndex(index) {
			var filtered = this._threads.filter(t => {
				if (t.threadIndex == index) return t;
			});

			return filtered[0];
		}
	}

	class VariablesState {
		constructor(callStack) {
			this._globalVariables = {};
			this._callStack = callStack;

			this._batchObservingVariableChanges;
		}
		get batchObservingVariableChanges() {
			return this._batchObservingVariableChanges;
		}
		set batchObservingVariableChanges(value) {
			value = !!value;
			this._batchObservingVariableChanges = value;
			if (value) {
				this._changedVariables = {};
			}

			// Finished observing variables in a batch - now send
			// notifications for changed variables all in one go.
			else {
					if (this._changedVariables != null) {
						for (var variableName in this._changedVariables) {
							var currentValue = this._globalVariables[variableName];
							variableChangedEvent(variableName, currentValue);
						}
					}

					this._changedVariables = null;
				}
		}
		get jsonToken() {
			return Json.DictionaryRuntimeObjsToJObject(this._globalVariables);
		}
		set jsonToken(value) {
			this._globalVariables = Json.JObjectToDictionaryRuntimeObjs(value);
		}

		CopyFrom(varState) {
			this._globalVariables = varState._globalVariables;
			this.variableChangedEvent = varState.variableChangedEvent;

			if (varState.batchObservingVariableChanges != this.batchObservingVariableChanges) {

				if (varState.batchObservingVariableChanges) {
					this._batchObservingVariableChanges = true;
					this._changedVariables = {};
				} else {
					this._batchObservingVariableChanges = false;
					this._changedVariables = null;
				}
			}
		}
		GetVariableWithName(name, contextIndex) {
			if (typeof contextIndex === 'undefined') contextIndex = -1;

			var varValue = this.GetRawVariableWithName(name, contextIndex);

			// Get value from pointer?
			//		var varPointer = varValue as VariablePointerValue;
			var varPointer = varValue;
			if (varPointer instanceof VariablePointerValue) {
				varValue = this.ValueAtVariablePointer(varPointer);
			}

			return varValue;
		}
		GetRawVariableWithName(name, contextIndex) {
			var varValue = null;

			// 0 context = global
			if (contextIndex == 0 || contextIndex == -1) {
				if (varValue = this._globalVariables[name]) return varValue;
			}

			// Temporary
			varValue = this._callStack.GetTemporaryVariableWithName(name, contextIndex);

			if (varValue == null) throw "RUNTIME ERROR: Variable '" + name + "' could not be found in context '" + contextIndex + "'. This shouldn't be possible so is a bug in the ink engine. Please try to construct a minimal story that reproduces the problem and report to inkle, thank you!";

			return varValue;
		}
		ValueAtVariablePointer(pointer) {
			return this.GetVariableWithName(pointer.variableName, pointer.contextIndex);
		}
		Assign(varAss, value) {
			var name = varAss.variableName;
			var contextIndex = -1;

			// Are we assigning to a global variable?
			var setGlobal = false;
			if (varAss.isNewDeclaration) {
				setGlobal = varAss.isGlobal;
			} else {
				setGlobal = !!this._globalVariables[name];
			}

			// Constructing new variable pointer reference
			if (varAss.isNewDeclaration) {
				//			var varPointer = value as VariablePointerValue;
				var varPointer = value;
				if (varPointer instanceof VariablePointerValue) {
					var fullyResolvedVariablePointer = this.ResolveVariablePointer(varPointer);
					value = fullyResolvedVariablePointer;
				}
			}

			// Assign to existing variable pointer?
			// Then assign to the variable that the pointer is pointing to by name.
			else {

					// De-reference variable reference to point to
					var existingPointer = null;
					do {
						//				existingPointer = GetRawVariableWithName (name, contextIndex) as VariablePointerValue;
						existingPointer = this.GetRawVariableWithName(name, contextIndex);
						if (existingPointer instanceof VariablePointerValue) {
							name = existingPointer.variableName;
							contextIndex = existingPointer.contextIndex;
							setGlobal = contextIndex == 0;
						}
					} while (existingPointer instanceof VariablePointerValue);
				}

			if (setGlobal) {
				this.SetGlobal(name, value);
			} else {
				this._callStack.SetTemporaryVariable(name, value, varAss.isNewDeclaration, contextIndex);
			}
		}
		SetGlobal(variableName, value) {
			var oldValue = null;
			oldValue = this._globalVariables[variableName];

			this._globalVariables[variableName] = value;

			if (this.variableChangedEvent != null && value !== oldValue) {

				if (this.batchObservingVariableChanges) {
					this._changedVariables.push(variableName);
				} else {
					this.variableChangedEvent(variableName, value);
				}
			}
		}
		ResolveVariablePointer(varPointer) {
			var contextIndex = varPointer.contextIndex;

			if (contextIndex == -1) contextIndex = this.GetContextIndexOfVariableNamed(varPointer.variableName);

			var valueOfVariablePointedTo = this.GetRawVariableWithName(varPointer.variableName, contextIndex);

			// Extra layer of indirection:
			// When accessing a pointer to a pointer (e.g. when calling nested or
			// recursive functions that take a variable references, ensure we don't create
			// a chain of indirection by just returning the final target.
			//		var doubleRedirectionPointer = valueOfVariablePointedTo as VariablePointerValue;
			var doubleRedirectionPointer = valueOfVariablePointedTo;
			if (doubleRedirectionPointer instanceof VariablePointerValue) {
				return doubleRedirectionPointer;
			}

			// Make copy of the variable pointer so we're not using the value direct from
			// the runtime. Temporary must be local to the current scope.
			else {
					return new VariablePointerValue(varPointer.variableName, contextIndex);
				}
		}
		GetContextIndexOfVariableNamed(varName) {
			if (this._globalVariables[varName]) return 0;

			return this._callStack.currentElementIndex;
		}
	}

	class StoryState {
		constructor(story) {
			//actual constructor
			this.story = story;

			this._outputStream = [];

			this._evaluationStack = [];

			this._callStack = new CallStack(story.rootContentContainer);
			this._variablesState = new VariablesState(this._callStack);

			this._visitCounts = {};
			this._turnIndices = {};
			this._currentTurnIndex = -1;

			this.divertedTargetObject = null;

			//there's no pseudo random generator in js, so try to generate somthing that's unique enough
			var timeSeed = new Date().getTime();
			this._storySeed = timeSeed + '-' + Math.round(Math.random() * 9999);

			this._currentChoices = [];
			this._currentErrors = null;

			this._currentRightGlue;

			this.didSafeExit = false;

			this.GoToStart();
		}
		get currentChoices() {
			return this._currentChoices;
		}
		get currentErrors() {
			return this._currentErrors;
		}
		get callStack() {
			return this._callStack;
		}
		get visitCounts() {
			return this._visitCounts;
		}
		get turnIndices() {
			return this._turnIndices;
		}
		get currentTurnIndex() {
			return this._currentTurnIndex;
		}
		get variablesState() {
			return this._variablesState;
		}
		get storySeed() {
			return this._storySeed;
		}
		get currentContentObject() {
			return this.callStack.currentElement.currentObject;
		}
		set currentContentObject(value) {
			this.callStack.currentElement.currentObject = value;
		}
		get hasError() {
			return this.currentErrors != null && this.currentErrors.length > 0;
		}
		get inExpressionEvaluation() {
			return this.callStack.currentElement.inExpressionEvaluation;
		}
		set inExpressionEvaluation(value) {
			this.callStack.currentElement.inExpressionEvaluation = value;
		}
		get evaluationStack() {
			return this._evaluationStack;
		}
		get outputStreamEndsInNewline() {
			if (this._outputStream.length > 0) {

				for (var i = this._outputStream.length - 1; i >= 0; i--) {
					var obj = this._outputStream[i];
					if (obj instanceof ControlCommand) // e.g. BeginString
						break;
					var text = this._outputStream[i];
					if (text instanceof StringValue$1) {
						if (text.isNewline) return true;else if (text.isNonWhitespace) break;
					}
				}
			}

			return false;
		}
		get outputStreamContainsContent() {
			for (var i = 0; i < this._outputStream.length; i++) {
				if (this._outputStream[i] instanceof StringValue$1) return true;
			}
			return false;
		}
		get currentGlueIndex() {
			for (var i = this._outputStream.length - 1; i >= 0; i--) {
				var c = this._outputStream[i];
				//			var glue = c as Glue;
				var glue = c;
				if (glue instanceof Glue) return i;else if (c instanceof ControlCommand) // e.g. BeginString
					break;
			}
			return -1;
		}
		get inStringEvaluation() {
			for (var i = this._outputStream.length - 1; i >= 0; i--) {
				//			var cmd = this._outputStream[i] as ControlCommand;
				var cmd = this._outputStream[i];
				if (cmd instanceof ControlCommand && cmd.commandType == ControlCommand.CommandType.BeginString) {
					return true;
				}
			}

			return false;
		}
		get currentText() {
			var sb = '';

			this._outputStream.forEach(outputObj => {
				//			var textContent = outputObj as StringValue;
				var textContent = outputObj;
				if (textContent instanceof StringValue$1) {
					sb += textContent.value;
				}
			});

			return sb;
		}
		get outputStream() {
			return this._outputStream;
		}
		get currentPath() {
			if (this.currentContentObject == null) return null;

			return this.currentContentObject.path;
		}
		set currentPath(value) {
			if (value != null) this.currentContentObject = this.story.ContentAtPath(value);else this.currentContentObject = null;
		}
		get currentContainer() {
			return this.callStack.currentElement.currentContainer;
		}
		get jsonToken() {
			var obj = {};

			var choiceThreads = null;
			this.currentChoices.forEach(c => {
				c.originalChoicePath = c.choicePoint.path.componentsString;
				c.originalThreadIndex = c.threadAtGeneration.threadIndex;

				if (this.callStack.ThreadWithIndex(c.originalThreadIndex) == null) {
					if (choiceThreads == null) choiceThreads = {};

					choiceThreads[c.originalThreadIndex.toString()] = c.threadAtGeneration.jsonToken;
				}
			});

			if (this.choiceThreads != null) obj["choiceThreads"] = this.choiceThreads;

			obj["callstackThreads"] = this.callStack.GetJsonToken();
			obj["variablesState"] = this.variablesState.jsonToken;

			obj["evalStack"] = Json$1.ListToJArray(this.evaluationStack);

			obj["outputStream"] = Json$1.ListToJArray(this._outputStream);

			obj["currentChoices"] = Json$1.ListToJArray(this.currentChoices);

			if (this._currentRightGlue) {
				var rightGluePos = this._outputStream.indexOf(this._currentRightGlue);
				if (rightGluePos != -1) {
					obj["currRightGlue"] = this._outputStream.indexOf(this._currentRightGlue);
				}
			}

			if (this.divertedTargetObject != null) obj["currentDivertTarget"] = this.divertedTargetObject.path.componentsString;

			obj["visitCounts"] = Json$1.IntDictionaryToJObject(visitCounts);
			obj["turnIndices"] = Json$1.IntDictionaryToJObject(turnIndices);
			obj["turnIdx"] = this.currentTurnIndex;
			obj["storySeed"] = this.storySeed;

			obj["inkSaveVersion"] = kInkSaveStateVersion;

			// Not using this right now, but could do in future.
			obj["inkFormatVersion"] = Story.inkVersionCurrent;

			return obj;
		}
		set jsonToken(value) {
			var jObject = value;

			var jSaveVersion = jObject["inkSaveVersion"];
			if (jSaveVersion == null) {
				throw "ink save format incorrect, can't load.";
			} else if (parseInt(jSaveVersion) < StoryState.kMinCompatibleLoadVersion) {
				throw "Ink save format isn't compatible with the current version (saw '" + jSaveVersion + "', but minimum is " + StoryState.kMinCompatibleLoadVersion + "), so can't load.";
			}

			this.callStack.SetJsonToken(jObject["callstackThreads"], this.story);
			this.variablesState.jsonToken = jObject["variablesState"];

			this.evaluationStack = Json$1.JArrayToRuntimeObjList(jObject["evalStack"]);

			this._outputStream = Json$1.JArrayToRuntimeObjList(jObject["outputStream"]);

			//		currentChoices = Json.JArrayToRuntimeObjList<Choice>((JArray)jObject ["currentChoices"]);
			this.currentChoices = Json$1.JArrayToRuntimeObjList(jObject["currentChoices"]);

			var propValue;
			if (propValue = jObject["currRightGlue"]) {
				var gluePos = parseInt(propValue);
				if (gluePos >= 0) {
					//				_currentRightGlue = _outputStream [gluePos] as Glue;
					this._currentRightGlue = this._outputStream[gluePos];
				}
			}

			var currentDivertTargetPath = jObject["currentDivertTarget"];
			if (currentDivertTargetPath != null) {
				var divertPath = new Path(currentDivertTargetPath.toString());
				this.divertedTargetObject = this.story.ContentAtPath(divertPath);
			}

			this.visitCounts = Json$1.JObjectToIntDictionary(jObject["visitCounts"]);
			this.turnIndices = Json$1.JObjectToIntDictionary(jObject["turnIndices"]);
			this.currentTurnIndex = parseInt(jObject["turnIdx"]);
			this.storySeed = parseInt(jObject["storySeed"]);

			//		var jChoiceThreads = jObject["choiceThreads"] as JObject;
			var jChoiceThreads = jObject["choiceThreads"];

			this.currentChoices.forEach(c => {
				c.choicePoint = this.story.ContentAtPath(new Path(c.originalChoicePath));

				var foundActiveThread = this.callStack.ThreadWithIndex(c.originalThreadIndex);
				if (foundActiveThread != null) {
					c.threadAtGeneration = foundActiveThread;
				} else {
					var jSavedChoiceThread = jChoiceThreads[c.originalThreadIndex.toString()];
					c.threadAtGeneration = new CallStack.Thread(jSavedChoiceThread, this.story);
				}
			});
		}

		GoToStart() {
			this.callStack.currentElement.currentContainer = this.story.mainContentContainer;
			this.callStack.currentElement.currentContentIndex = 0;
		}
		ResetErrors() {
			this._currentErrors = null;
		}
		ResetOutput() {
			this._outputStream.length = 0;
		}
		PushEvaluationStack(obj) {
			this.evaluationStack.push(obj);
		}
		PopEvaluationStack(numberOfObjects) {
			if (!numberOfObjects) {
				var obj = this.evaluationStack.pop();
				return obj;
			} else {
				if (numberOfObjects > this.evaluationStack.length) {
					throw "trying to pop too many objects";
				}

				var popped = this.evaluationStack.splice(this.evaluationStack.length - numberOfObjects, numberOfObjects);
				return popped;
			}
		}
		PeekEvaluationStack() {
			return this.evaluationStack[this.evaluationStack.length - 1];
		}
		PushToOutputStream(obj) {
			//		var text = obj as StringValue;
			var text = obj;
			if (text instanceof StringValue$1) {
				var listText = this.TrySplittingHeadTailWhitespace(text);
				if (listText != null) {
					listText.forEach(textObj => {
						this.PushToOutputStreamIndividual(textObj);
					});
					return;
				}
			}

			this.PushToOutputStreamIndividual(obj);
		}
		TrySplittingHeadTailWhitespace(single) {
			var str = single.value;

			var headFirstNewlineIdx = -1;
			var headLastNewlineIdx = -1;
			for (var i = 0; i < str.length; ++i) {
				var c = str[i];
				if (c == '\n') {
					if (headFirstNewlineIdx == -1) headFirstNewlineIdx = i;
					headLastNewlineIdx = i;
				} else if (c == ' ' || c == '\t') continue;else break;
			}

			var tailLastNewlineIdx = -1;
			var tailFirstNewlineIdx = -1;
			for (var i = 0; i < str.length; ++i) {
				var c = str[i];
				if (c == '\n') {
					if (tailLastNewlineIdx == -1) tailLastNewlineIdx = i;
					tailFirstNewlineIdx = i;
				} else if (c == ' ' || c == '\t') continue;else break;
			}

			// No splitting to be done?
			if (headFirstNewlineIdx == -1 && tailLastNewlineIdx == -1) return null;

			var listTexts = [];
			var innerStrStart = 0;
			var innerStrEnd = str.length;

			if (headFirstNewlineIdx != -1) {
				if (headFirstNewlineIdx > 0) {
					var leadingSpaces = str.substring(0, headFirstNewlineIdx);
					listTexts.push(leadingSpaces);
				}
				listTexts.push(new StringValue$1("\n"));
				innerStrStart = headLastNewlineIdx + 1;
			}

			if (tailLastNewlineIdx != -1) {
				innerStrEnd = tailFirstNewlineIdx;
			}

			if (innerStrEnd > innerStrStart) {
				var innerStrText = str.substring(innerStrStart, innerStrEnd - innerStrStart);
				listTexts.push(new StringValue$1(innerStrText));
			}

			if (tailLastNewlineIdx != -1 && tailFirstNewlineIdx > headLastNewlineIdx) {
				listTexts.push(new StringValue$1("\n"));
				if (tailLastNewlineIdx < str.length - 1) {
					var numSpaces = str.Length - tailLastNewlineIdx - 1;
					var trailingSpaces = new StringValue$1(str.substring(tailLastNewlineIdx + 1, numSpaces));
					listTexts.push(trailingSpaces);
				}
			}

			return listTexts;
		}
		PushToOutputStreamIndividual(obj) {
			var glue = obj;
			var text = obj;

			var includeInOutput = true;

			if (glue instanceof Glue) {
				// Found matching left-glue for right-glue? Close it.
				var foundMatchingLeftGlue = glue.isLeft && this._currentRightGlue && glue.parent == this._currentRightGlue.parent;
				if (foundMatchingLeftGlue) {
					this._currentRightGlue = null;
				}

				// Left/Right glue is auto-generated for inline expressions
				// where we want to absorb newlines but only in a certain direction.
				// "Bi" glue is written by the user in their ink with <>
				if (glue.isLeft || glue.isBi) {
					this.TrimNewlinesFromOutputStream(foundMatchingLeftGlue);
				}

				// New right-glue
				var isNewRightGlue = glue.isRight && this._currentRightGlue == null;
				if (isNewRightGlue) {
					this._currentRightGlue = glue;
				}

				includeInOutput = glue.isBi || isNewRightGlue;
			} else if (text instanceof StringValue$1) {

				if (this.currentGlueIndex != -1) {

					// Absorb any new newlines if there's existing glue
					// in the output stream.
					// Also trim any extra whitespace (spaces/tabs) if so.
					if (text.isNewline) {
						this.TrimFromExistingGlue();
						includeInOutput = false;
					}

					// Able to completely reset when
					else if (text.isNonWhitespace) {
							this.RemoveExistingGlue();
							this._currentRightGlue = null;
						}
				} else if (text.isNewline) {
					if (this.outputStreamEndsInNewline || !this.outputStreamContainsContent) includeInOutput = false;
				}
			}

			if (includeInOutput) {
				this._outputStream.push(obj);
			}
		}
		TrimNewlinesFromOutputStream(stopAndRemoveRightGlue) {
			var removeWhitespaceFrom = -1;
			var rightGluePos = -1;
			var foundNonWhitespace = false;

			// Work back from the end, and try to find the point where
			// we need to start removing content. There are two ways:
			//  - Start from the matching right-glue (because we just saw a left-glue)
			//  - Simply work backwards to find the first newline in a string of whitespace
			var i = this._outputStream.length - 1;
			while (i >= 0) {
				var obj = this._outputStream[i];
				//			var cmd = obj as ControlCommand;
				var cmd = obj;
				//			var txt = obj as StringValue;
				var txt = obj;
				//			var glue = obj as Glue;
				var glue = obj;

				if (cmd instanceof ControlCommand || txt instanceof StringValue$1 && txt.isNonWhitespace) {
					foundNonWhitespace = true;
					if (!stopAndRemoveRightGlue) break;
				} else if (stopAndRemoveRightGlue && glue instanceof Glue && glue.isRight) {
					rightGluePos = i;
					break;
				} else if (txt instanceof StringValue$1 && txt.isNewline && !foundNonWhitespace) {
					removeWhitespaceFrom = i;
				}
				i--;
			}

			// Remove the whitespace
			if (removeWhitespaceFrom >= 0) {
				i = removeWhitespaceFrom;
				while (i < this._outputStream.length) {
					//				var text = _outputStream [i] as StringValue;
					var text = this._outputStream[i];
					if (text instanceof StringValue$1) {
						this._outputStream.splice(i, 1);
					} else {
						i++;
					}
				}
			}

			// Remove the glue (it will come before the whitespace,
			// so index is still valid)
			if (stopAndRemoveRightGlue && rightGluePos > -1) this._outputStream.splice(rightGluePos, 1);
		}
		TrimFromExistingGlue() {
			var i = this.currentGlueIndex;
			while (i < this._outputStream.length) {
				//			var txt = _outputStream [i] as StringValue;
				var txt = this._outputStream[i];
				if (txt instanceof StringValue$1 && !txt.isNonWhitespace) this._outputStream.splice(i, 1);else i++;
			}
		}
		RemoveExistingGlue() {
			for (var i = this._outputStream.length - 1; i >= 0; i--) {
				var c = this._outputStream[i];
				if (c instanceof Glue) {
					this._outputStream.splice(i, 1);
				} else if (c instanceof ControlCommand) {
					// e.g. BeginString
					break;
				}
			}
		}
		ForceEndFlow() {
			this.currentContentObject = null;

			while (this.callStack.canPopThread) this.callStack.PopThread();

			while (this.callStack.canPop) callStack.Pop();

			this.currentChoices.length = 0;

			this.didSafeExit = true;
		}
		SetChosenPath(path) {
			// Changing direction, assume we need to clear current set of choices
			this.currentChoices.length = 0;

			this.currentPath = path;

			this._currentTurnIndex++;
		}
		AddError(message) {
			if (this._currentErrors == null) {
				this._currentErrors = [];
			}

			this._currentErrors.push(message);
		}
		VisitCountAtPathString(pathString) {
			var visitCountOut;
			if (visitCountOut = this.visitCounts[pathString]) return visitCountOut;

			return -1;
		}
		Copy() {
			var copy = new StoryState(this.story);

			copy.outputStream.push.apply(copy.outputStream, this._outputStream);
			copy.currentChoices.push.apply(copy.currentChoices, this.currentChoices);

			if (this.hasError) {
				copy.currentErrors = [];
				copy.currentErrors.push.apply(copy.currentErrors, this.currentErrors);
			}

			copy._callStack = new CallStack(this.callStack);

			copy._currentRightGlue = this._currentRightGlue;

			copy._variablesState = new VariablesState(copy.callStack);
			copy.variablesState.CopyFrom(this.variablesState);

			copy.evaluationStack.push.apply(copy.evaluationStack, this.evaluationStack);

			if (this.divertedTargetObject != null) copy.divertedTargetObject = this.divertedTargetObject;

			copy._visitCounts = {};
			copy._turnIndices = {};
			copy._currentTurnIndex = this.currentTurnIndex;
			copy._storySeed = this.storySeed;

			copy.didSafeExit = this.didSafeExit;

			return copy;
		}

		toJson(indented) {
			throw "figur eout formating option";
			return this.jsonToken.toString(indented ? Formatting.Indented : Formatting.None);
		}
		LoadJson(jsonString) {
			this.jsonToken = JSON.parse(json);
		}
	}

	StoryState.kInkSaveStateVersion = 2;
	StoryState.kMinCompatibleLoadVersion = 2;

	//complete
	class Choice {
		constructor(choice) {
			this.text;
			this.index;
			this.choicePoint;
			this.threadAtGeneration;

			this._originalThreadIndex;
			this._originalChoicePath;

			if (choice) this.choicePoint = choice;
		}
		get pathStringOnChoice() {
			return this.choicePoint.pathStringOnChoice;
		}
	}

	class Story extends InkObject {
		constructor(jsonString) {
			super();

			this.inkVersionCurrent = 11;
			this.inkVersionMinimumCompatible = 11;

			if (jsonString instanceof Container) {
				this._mainContentContainer = jsonString;
				this._externals = {};
			} else {
				var rootObject = JSON.parse(jsonString);

				var versionObj = rootObject["inkVersion"];
				if (versionObj == null) throw "ink version number not found. Are you sure it's a valid .ink.json file?";

				var formatFromFile = parseInt(versionObj);
				if (formatFromFile > this.inkVersionCurrent) {
					throw "Version of ink used to build story was newer than the current verison of the engine";
				} else if (formatFromFile < this.inkVersionMinimumCompatible) {
					throw "Version of ink used to build story is too old to be loaded by this verison of the engine";
				} else if (formatFromFile != this.inkVersionCurrent) {
					console.warn("WARNING: Version of ink used to build story doesn't match current version of engine. Non-critical, but recommend synchronising.");
				}

				var rootToken = rootObject["root"];
				if (rootToken == null) throw "Root node for ink not found. Are you sure it's a valid .ink.json file?";

				this._mainContentContainer = Json$1.JTokenToRuntimeObject(rootToken);

				this._hasValidatedExternals = true;

				this.ResetState();
			}
		}

		get currentChoices() {
			// Don't include invisible choices for external usage.
			var choices = [];

			this._state.currentChoices.forEach(c => {
				if (!c.choicePoint.isInvisibleDefault) {
					c.index = choices.length;
					choices.push(c);
				}
			});

			return choices;
		}
		get currentText() {
			return this.state.currentText;
		}
		get currentErrors() {
			return this.state.currentErrors;
		}
		get hasError() {
			return this.state.hasError;
		}
		get variablesState() {
			return this.state.variablesState;
		}
		get state() {
			return this._state;
		}

		get mainContentContainer() {
			if (this._temporaryEvaluationContainer) {
				return this._temporaryEvaluationContainer;
			} else {
				return this._mainContentContainer;
			}
		}
		get canContinue() {
			return this.state.currentContentObject != null && !this.state.hasError;
		}

		ResetState() {
			this._state = new StoryState(this);
			//		this._state.variablesState.variableChangedEvent += VariableStateDidChangeEvent;//@TODO: figure out what this does

			this.ResetGlobals();
		}
		ResetErrors() {
			this._state.ResetErrors();
		}
		ResetCallstack() {
			this._state.ForceEndFlow();
		}
		ResetGlobals() {
			if (this._mainContentContainer.namedContent["global decl"]) {
				var originalPath = this.state.currentPath;

				this.ChoosePathString("global decl");

				// Continue, but without validating external bindings,
				// since we may be doing this reset at initialisation time.
				this.ContinueInternal();

				this.state.currentPath = originalPath;
			}
		}
		Continue() {
			if (!this._hasValidatedExternals) this.ValidateExternalBindings();

			return this.ContinueInternal();
		}
		ContinueInternal() {
			if (!this.canContinue) {
				throw "Can't continue - should check canContinue before calling Continue";
			}

			this._state.ResetOutput();

			this._state.didSafeExit = false;

			this._state.variablesState.batchObservingVariableChanges = true;

			try {

				var stateAtLastNewline = null;

				// The basic algorithm here is:
				//
				//     do { Step() } while( canContinue && !outputStreamEndsInNewline );
				//
				// But the complexity comes from:
				//  - Stepping beyond the newline in case it'll be absorbed by glue later
				//  - Ensuring that non-text content beyond newlines are generated - i.e. choices,
				//    which are actually built out of text content.
				// So we have to take a snapshot of the state, continue prospectively,
				// and rewind if necessary.
				// This code is slightly fragile :-/
				//

				do {

					// Run main step function (walks through content)
					this.Step();

					// Run out of content and we have a default invisible choice that we can follow?
					if (!this.canContinue) {
						this.TryFollowDefaultInvisibleChoice();
					}

					// Don't save/rewind during string evaluation, which is e.g. used for choices
					if (!this.state.inStringEvaluation) {

						// We previously found a newline, but were we just double checking that
						// it wouldn't immediately be removed by glue?
						if (stateAtLastNewline != null) {

							// Cover cases that non-text generated content was evaluated last step
							var currText = this.currentText;
							var prevTextLength = stateAtLastNewline.currentText.length;

							// Output has been extended?
							if (currText !== stateAtLastNewline.currentText) {

								// Original newline still exists?
								if (currText.length >= prevTextLength && currText[prevTextLength - 1] == '\n') {

									this.RestoreStateSnapshot(stateAtLastNewline);
									break;
								}

								// Newline that previously existed is no longer valid - e.g.
								// glue was encounted that caused it to be removed.
								else {
										stateAtLastNewline = null;
									}
							}
						}

						// Current content ends in a newline - approaching end of our evaluation
						if (this.state.outputStreamEndsInNewline) {

							// If we can continue evaluation for a bit:
							// Create a snapshot in case we need to rewind.
							// We're going to continue stepping in case we see glue or some
							// non-text content such as choices.
							if (this.canContinue) {
								stateAtLastNewline = this.StateSnapshot();
							}

							// Can't continue, so we're about to exit - make sure we
							// don't have an old state hanging around.
							else {
									stateAtLastNewline = null;
								}
						}
					}
				} while (this.canContinue);

				// Need to rewind, due to evaluating further than we should?
				if (stateAtLastNewline != null) {
					this.RestoreStateSnapshot(stateAtLastNewline);
				}

				// Finished a section of content / reached a choice point?
				if (!this.canContinue) {

					if (this.state.callStack.canPopThread) {
						throw "Thread available to pop, threads should always be flat by the end of evaluation?";
					}

					if (this.currentChoices.length == 0 && !this.state.didSafeExit) {
						if (this.state.callStack.CanPop(PushPopType$1.Tunnel)) {
							throw "unexpectedly reached end of content. Do you need a '->->' to return from a tunnel?";
						} else if (this.state.callStack.CanPop(PushPopType$1.Function)) {
							throw "unexpectedly reached end of content. Do you need a '~ return'?";
						} else if (!this.state.callStack.canPop) {
							throw "ran out of content. Do you need a '-> DONE' or '-> END'?";
						} else {
							throw "unexpectedly reached end of content for unknown reason. Please debug compiler!";
						}
					}
				}
			} catch (e) {
				throw e;
				this.AddError(e.Message, e.useEndLineNumber);
			} finally {
				this.state.didSafeExit = false;

				this._state.variablesState.batchObservingVariableChanges = false;
			}

			return this.currentText;
		}
		ContinueMaximally() {
			var sb = '';

			while (this.canContinue) {
				sb += this.Continue();
			}

			return sb;
		}
		ContentAtPath(path) {
			return this.mainContentContainer.ContentAtPath(path);
		}
		StateSnapshot() {
			return this.state.Copy();
		}
		RestoreStateSnapshot(state) {
			this._state = state;
		}
		Step() {
			var shouldAddToStream = true;

			// Get current content
			var currentContentObj = this.state.currentContentObject;
			if (currentContentObj == null) {
				return;
			}
			// Step directly to the first element of content in a container (if necessary)
			//		Container currentContainer = currentContentObj as Container;
			var currentContainer = currentContentObj;
			while (currentContainer instanceof Container) {

				// Mark container as being entered
				this.VisitContainer(currentContainer, true);

				// No content? the most we can do is step past it
				if (currentContainer.content.length == 0) break;

				currentContentObj = currentContainer.content[0];
				this.state.callStack.currentElement.currentContentIndex = 0;
				this.state.callStack.currentElement.currentContainer = currentContainer;

				//			currentContainer = currentContentObj as Container;
				currentContainer = currentContentObj;
			}
			currentContainer = this.state.callStack.currentElement.currentContainer;

			// Is the current content object:
			//  - Normal content
			//  - Or a logic/flow statement - if so, do it
			// Stop flow if we hit a stack pop when we're unable to pop (e.g. return/done statement in knot
			// that was diverted to rather than called as a function)
			var isLogicOrFlowControl = this.PerformLogicAndFlowControl(currentContentObj);

			// Has flow been forced to end by flow control above?
			if (this.state.currentContentObject == null) {
				return;
			}

			if (isLogicOrFlowControl) {
				shouldAddToStream = false;
			}

			// Choice with condition?
			//		var choicePoint = currentContentObj as ChoicePoint;
			var choicePoint = currentContentObj;
			if (choicePoint instanceof ChoicePoint) {
				var choice = this.ProcessChoice(choicePoint);
				if (choice) {
					this.state.currentChoices.push(choice);
				}

				currentContentObj = null;
				shouldAddToStream = false;
			}

			// If the container has no content, then it will be
			// the "content" itself, but we skip over it.
			if (currentContentObj instanceof Container) {
				shouldAddToStream = false;
			}

			// Content to add to evaluation stack or the output stream
			if (shouldAddToStream) {

				// If we're pushing a variable pointer onto the evaluation stack, ensure that it's specific
				// to our current (possibly temporary) context index. And make a copy of the pointer
				// so that we're not editing the original runtime object.
				//			var varPointer = currentContentObj as VariablePointerValue;
				var varPointer = currentContentObj;
				if (varPointer instanceof VariablePointerValue && varPointer.contextIndex == -1) {

					// Create new object so we're not overwriting the story's own data
					var contextIdx = this.state.callStack.ContextForVariableNamed(varPointer.variableName);
					currentContentObj = new VariablePointerValue(varPointer.variableName, contextIdx);
				}

				// Expression evaluation content
				if (this.state.inExpressionEvaluation) {
					this.state.PushEvaluationStack(currentContentObj);
				}
				// Output stream content (i.e. not expression evaluation)
				else {
						this.state.PushToOutputStream(currentContentObj);
					}
			}

			// Increment the content pointer, following diverts if necessary
			this.NextContent();

			// Starting a thread should be done after the increment to the content pointer,
			// so that when returning from the thread, it returns to the content after this instruction.
			//		var controlCmd = currentContentObj as ControlCommand;
			var controlCmd = currentContentObj;
			if (controlCmd instanceof ControlCommand && controlCmd.commandType == ControlCommand.CommandType.StartThread) {
				this.state.callStack.PushThread();
			}
		}
		VisitContainer(container, atStart) {
			if (!container.countingAtStartOnly || atStart) {
				if (container.visitsShouldBeCounted) this.IncrementVisitCountForContainer(container);

				if (container.turnIndexShouldBeCounted) this.RecordTurnIndexVisitToContainer(container);
			}
		}
		VisitChangedContainersDueToDivert(previousContentObject, newContentObject) {
			if (!previousContentObject || !newContentObject) return;

			// First, find the previously open set of containers
			var prevContainerSet = [];
			//		Container prevAncestor = previousContentObject as Container ?? previousContentObject.parent as Container;
			var prevAncestor = previousContentObject instanceof Container ? previousContentObject : previousContentObject.parent;
			while (prevAncestor instanceof Container) {
				prevContainerSet.push(prevAncestor);
				//			prevAncestor = prevAncestor.parent as Container;
				prevAncestor = prevAncestor.parent;
			}

			// If the new object is a container itself, it will be visited automatically at the next actual
			// content step. However, we need to walk up the new ancestry to see if there are more new containers
			var currentChildOfContainer = newContentObject;
			//		Container currentContainerAncestor = currentChildOfContainer.parent as Container;
			var currentContainerAncestor = currentChildOfContainer.parent;
			while (currentContainerAncestor instanceof Container && prevContainerSet.indexOf(currentContainerAncestor) < 0) {

				// Check whether this ancestor container is being entered at the start,
				// by checking whether the child object is the first.
				var enteringAtStart = currentContainerAncestor.content.length > 0 && currentChildOfContainer == currentContainerAncestor.content[0];

				// Mark a visit to this container
				this.VisitContainer(currentContainerAncestor, enteringAtStart);

				currentChildOfContainer = currentContainerAncestor;
				//			currentContainerAncestor = currentContainerAncestor.parent as Container;
				currentContainerAncestor = currentContainerAncestor.parent;
			}
		}
		ProcessChoice(choicePoint) {
			var showChoice = true;

			// Don't create choice if choice point doesn't pass conditional
			if (choicePoint.hasCondition) {
				var conditionValue = this.state.PopEvaluationStack();
				if (!conditionValue) {
					showChoice = false;
				}
			}

			var startText = "";
			var choiceOnlyText = "";

			if (choicePoint.hasChoiceOnlyContent) {
				//			var choiceOnlyStrVal = state.PopEvaluationStack () as StringValue;
				var choiceOnlyStrVal = this.state.PopEvaluationStack();
				choiceOnlyText = choiceOnlyStrVal.value;
			}

			if (choicePoint.hasStartContent) {
				//			var startStrVal = state.PopEvaluationStack () as StringValue;
				var startStrVal = this.state.PopEvaluationStack();
				startText = startStrVal.value;
			}

			// Don't create choice if player has already read this content
			if (choicePoint.onceOnly) {
				var visitCount = this.VisitCountForContainer(choicePoint.choiceTarget);
				if (visitCount > 0) {
					showChoice = false;
				}
			}

			var choice = new Choice(choicePoint);
			choice.threadAtGeneration = this.state.callStack.currentThread.Copy();

			// We go through the full process of creating the choice above so
			// that we consume the content for it, since otherwise it'll
			// be shown on the output stream.
			if (!showChoice) {
				return null;
			}

			// Set final text for the choice
			choice.text = startText + choiceOnlyText;

			return choice;
		}
		IsTruthy(obj) {
			var truthy = false;
			if (obj instanceof Value) {
				var val = obj;

				if (val instanceof DivertTargetValue$1) {
					var divTarget = val;
					this.Error("Shouldn't use a divert target (to " + divTarget.targetPath + ") as a conditional value. Did you intend a function call 'likeThis()' or a read count check 'likeThis'? (no arrows)");
					return false;
				}

				return val.isTruthy;
			}
			return truthy;
		}
		PerformLogicAndFlowControl(contentObj) {
			if (contentObj == null) {
				return false;
			}

			// Divert
			if (contentObj instanceof Divert) {
				var currentDivert = contentObj;

				if (currentDivert.hasVariableTarget) {
					var varName = currentDivert.variableDivertName;

					var varContents = this.state.variablesState.GetVariableWithName(varName);

					if (!(varContents instanceof DivertTargetValue$1)) {

						//					var intContent = varContents as IntValue;
						var intContent = varContents;

						var errorMessage = "Tried to divert to a target from a variable, but the variable (" + varName + ") didn't contain a divert target, it ";
						if (intContent instanceof IntValue && intContent.value == 0) {
							errorMessage += "was empty/null (the value 0).";
						} else {
							errorMessage += "contained '" + varContents + "'.";
						}

						this.Error(errorMessage);
					}

					var target = varContents;
					this.state.divertedTargetObject = this.ContentAtPath(target.targetPath);
				} else if (currentDivert.isExternal) {
					this.CallExternalFunction(currentDivert.targetPathString, currentDivert.externalArgs);
					return true;
				} else {
					this.state.divertedTargetObject = currentDivert.targetContent;
				}

				if (currentDivert.pushesToStack) {
					this.state.callStack.Push(currentDivert.stackPushType);
				}

				if (this.state.divertedTargetObject == null && !currentDivert.isExternal) {

					// Human readable name available - runtime divert is part of a hard-written divert that to missing content
					if (currentDivert && currentDivert.debugMetadata.sourceName != null) {
						this.Error("Divert target doesn't exist: " + currentDivert.debugMetadata.sourceName);
					} else {
						this.Error("Divert resolution failed: " + currentDivert);
					}
				}

				return true;
			}

			// Branch (conditional divert)
			else if (contentObj instanceof Branch) {
					var branch = contentObj;
					var conditionValue = this.state.PopEvaluationStack();

					if (this.IsTruthy(conditionValue)) this.state.divertedTargetObject = branch.trueDivert.targetContent;else if (branch.falseDivert) this.state.divertedTargetObject = branch.falseDivert.targetContent;

					return true;
				}

				// Start/end an expression evaluation? Or print out the result?
				else if (contentObj instanceof ControlCommand) {
						var evalCommand = contentObj;

						switch (evalCommand.commandType) {

							case ControlCommand.CommandType.EvalStart:
								if (this.state.inExpressionEvaluation) console.warn("Already in expression evaluation?");
								this.state.inExpressionEvaluation = true;
								break;

							case ControlCommand.CommandType.EvalEnd:
								if (!this.state.inExpressionEvaluation) console.warn("Not in expression evaluation mode");
								this.state.inExpressionEvaluation = false;
								break;

							case ControlCommand.CommandType.EvalOutput:

								// If the expression turned out to be empty, there may not be anything on the stack
								if (this.state.evaluationStack.length > 0) {

									var output = this.state.PopEvaluationStack();

									// Functions may evaluate to Void, in which case we skip output
									if (!(output instanceof Void)) {
										// TODO: Should we really always blanket convert to string?
										// It would be okay to have numbers in the output stream the
										// only problem is when exporting text for viewing, it skips over numbers etc.
										var text = new StringValue$1(output.toString());

										this.state.PushToOutputStream(text);
									}
								}
								break;

							case ControlCommand.CommandType.NoOp:
								break;

							case ControlCommand.CommandType.Duplicate:
								this.state.PushEvaluationStack(this.state.PeekEvaluationStack());
								break;

							case ControlCommand.CommandType.PopEvaluatedValue:
								this.state.PopEvaluationStack();
								break;

							case ControlCommand.CommandType.PopFunction:
							case ControlCommand.CommandType.PopTunnel:

								var popType = evalCommand.commandType == ControlCommand.CommandType.PopFunction ? PushPopType$1.Function : PushPopType$1.Tunnel;

								if (this.state.callStack.currentElement.type != popType || !this.state.callStack.canPop) {

									var names = new {}();
									names[PushPopType$1.Function] = "function return statement (~ return)";
									names[PushPopType$1.Tunnel] = "tunnel onwards statement (->->)";

									var expected = names[this.state.callStack.currentElement.type];
									if (!this.state.callStack.canPop) {
										expected = "end of flow (-> END or choice)";
									}

									var errorMsg = "Found " + names[popType] + ", when expected " + expected;

									this.Error(errorMsg);
								} else {
									this.state.callStack.Pop();
								}
								break;

							case ControlCommand.CommandType.BeginString:
								this.state.PushToOutputStream(evalCommand);

								if (!this.state.inExpressionEvaluation) console.warn("Expected to be in an expression when evaluating a string");
								this.state.inExpressionEvaluation = false;
								break;

							case ControlCommand.CommandType.EndString:

								// Since we're iterating backward through the content,
								// build a stack so that when we build the string,
								// it's in the right order
								var contentStackForString = [];

								var outputCountConsumed = 0;
								for (var i = this.state.outputStream.length - 1; i >= 0; --i) {
									var obj = this.state.outputStream[i];

									outputCountConsumed++;

									//					var command = obj as ControlCommand;
									var command = obj;
									if (command instanceof ControlCommand && command.commandType == ControlCommand.CommandType.BeginString) {
										break;
									}

									if (obj instanceof StringValue$1) contentStackForString.push(obj);
								}

								// Consume the content that was produced for this string
								this.state.outputStream.splice(this.state.outputStream.length - outputCountConsumed, outputCountConsumed);

								// Build string out of the content we collected
								var sb = '';
								contentStackForString.forEach(c => {
									sb += c.toString();
								});

								// Return to expression evaluation (from content mode)
								this.state.inExpressionEvaluation = true;
								this.state.PushEvaluationStack(new StringValue$1(sb));
								break;

							case ControlCommand.CommandType.ChoiceCount:
								var choiceCount = this.currentChoices.length;
								this.state.PushEvaluationStack(new IntValue(choiceCount));
								break;

							case ControlCommand.CommandType.TurnsSince:
								var target = this.state.PopEvaluationStack();
								if (!(target instanceof DivertTargetValue$1)) {
									var extraNote = "";
									if (target instanceof IntValue) extraNote = ". Did you accidentally pass a read count ('knot_name') instead of a target ('-> knot_name')?";
									this.Error("TURNS_SINCE expected a divert target (knot, stitch, label name), but saw " + target + extraNote);
									break;
								}

								//				var divertTarget = target as DivertTargetValue;
								var divertTarget = target;
								//				var container = ContentAtPath (divertTarget.targetPath) as Container;
								var container = this.ContentAtPath(divertTarget.targetPath);
								var turnCount = this.TurnsSinceForContainer(container);
								this.state.PushEvaluationStack(new IntValue(turnCount));
								break;

							case ControlCommand.CommandType.VisitIndex:
								var count = this.VisitCountForContainer(this.state.currentContainer) - 1; // index not count
								this.state.PushEvaluationStack(new IntValue(count));
								break;

							case ControlCommand.CommandType.SequenceShuffleIndex:
								var shuffleIndex = this.NextSequenceShuffleIndex();
								this.state.PushEvaluationStack(new IntValue(shuffleIndex));
								break;

							case ControlCommand.CommandType.StartThread:
								// Handled in main step function
								break;

							case ControlCommand.CommandType.Done:

								// We may exist in the context of the initial
								// act of creating the thread, or in the context of
								// evaluating the content.
								if (this.state.callStack.canPopThread) {
									this.state.callStack.PopThread();
								}

								// In normal flow - allow safe exit without warning
								else {
										this.state.didSafeExit = true;
									}

								break;

							// Force flow to end completely
							case ControlCommand.CommandType.End:
								this.state.ForceEndFlow();
								break;

							default:
								this.Error("unhandled ControlCommand: " + evalCommand);
								break;
						}

						return true;
					}

					// Variable assignment
					else if (contentObj instanceof VariableAssignment) {
							var varAss = contentObj;
							var assignedVal = this.state.PopEvaluationStack();

							// When in temporary evaluation, don't create new variables purely within
							// the temporary context, but attempt to create them globally
							//var prioritiseHigherInCallStack = _temporaryEvaluationContainer != null;

							this.state.variablesState.Assign(varAss, assignedVal);

							return true;
						}

						// Variable reference
						else if (contentObj instanceof VariableReference) {
								var varRef = contentObj;
								var foundValue = null;

								// Explicit read count value
								if (varRef.pathForCount != null) {

									var container = varRef.containerForCount;
									var count = this.VisitCountForContainer(container);
									foundValue = new IntValue(count);
								}

								// Normal variable reference
								else {

										foundValue = this.state.variablesState.GetVariableWithName(varRef.name);

										if (foundValue == null) {
											this.Error("Uninitialised variable: " + varRef.name);
											foundValue = new IntValue(0);
										}
									}

								this.state.evaluationStack.push(foundValue);

								return true;
							}

							// Native function call
							else if (contentObj instanceof NativeFunctionCall) {
									var func = contentObj;
									var funcParams = this.state.PopEvaluationStack(func.numberOfParameters);
									var result = func.Call(funcParams);
									this.state.evaluationStack.push(result);
									return true;
								}

			// No control content, must be ordinary content
			return false;
		}
		ChoosePathString(path) {
			this.ChoosePath(new Path$1(path));
		}
		ChoosePath(path) {
			var prevContentObj = this.state.currentContentObject;

			this.state.SetChosenPath(path);

			var newContentObj = this.state.currentContentObject;

			// Take a note of newly visited containers for read counts etc
			this.VisitChangedContainersDueToDivert(prevContentObj, newContentObj);
		}
		ChooseChoiceIndex(choiceIdx) {
			choiceIdx = choiceIdx;
			var choices = this.currentChoices;
			if (choiceIdx < 0 || choiceIdx > choices.length) console.warn("choice out of range");

			// Replace callstack with the one from the thread at the choosing point,
			// so that we can jump into the right place in the flow.
			// This is important in case the flow was forked by a new thread, which
			// can create multiple leading edges for the story, each of
			// which has its own context.
			var choiceToChoose = choices[choiceIdx];
			this.state.callStack.currentThread = choiceToChoose.threadAtGeneration;

			this.ChoosePath(choiceToChoose.choicePoint.choiceTarget.path);
		}
		/*
	 external funcs
	 */
		/*
	 observers
	 */

		NextContent() {
			// Divert step?
			if (this.state.divertedTargetObject != null) {

				var prevObj = this.state.currentContentObject;

				this.state.currentContentObject = this.state.divertedTargetObject;
				this.state.divertedTargetObject = null;

				// Check for newly visited containers
				// Rather than using state.currentContentObject and state.divertedTargetObject,
				// we have to make sure that both come via the state.currentContentObject property,
				// since it can actually get transformed slightly when set (it can end up stepping
				// into a container).
				this.VisitChangedContainersDueToDivert(prevObj, this.state.currentContentObject);

				// Diverted location has valid content?
				if (this.state.currentContentObject != null) {
					return;
				}

				// Otherwise, if diverted location doesn't have valid content,
				// drop down and attempt to increment.
				// This can happen if the diverted path is intentionally jumping
				// to the end of a container - e.g. a Conditional that's re-joining
			}

			var successfulPointerIncrement = this.IncrementContentPointer();

			// Ran out of content? Try to auto-exit from a function,
			// or finish evaluating the content of a thread
			if (!successfulPointerIncrement) {

				var didPop = false;

				if (this.state.callStack.CanPop(PushPopType$1.Function)) {

					// Pop from the call stack
					this.state.callStack.Pop(PushPopType$1.Function);

					// This pop was due to dropping off the end of a function that didn't return anything,
					// so in this case, we make sure that the evaluator has something to chomp on if it needs it
					if (this.state.inExpressionEvaluation) {
						this.state.PushEvaluationStack(new Void());
					}

					didPop = true;
				} else if (this.state.callStack.canPopThread) {
					this.state.callStack.PopThread();

					didPop = true;
				}

				// Step past the point where we last called out
				if (didPop && this.state.currentContentObject != null) {
					this.NextContent();
				}
			}
		}
		IncrementContentPointer() {
			var successfulIncrement = true;

			var currEl = this.state.callStack.currentElement;
			currEl.currentContentIndex++;

			// Each time we step off the end, we fall out to the next container, all the
			// while we're in indexed rather than named content
			while (currEl.currentContentIndex >= currEl.currentContainer.content.length) {

				successfulIncrement = false;

				//			Container nextAncestor = currEl.currentContainer.parent as Container;
				var nextAncestor = currEl.currentContainer.parent;
				if (nextAncestor instanceof Container === false) {
					break;
				}

				var indexInAncestor = nextAncestor.content.indexOf(currEl.currentContainer);
				if (indexInAncestor == -1) {
					break;
				}

				currEl.currentContainer = nextAncestor;
				currEl.currentContentIndex = indexInAncestor + 1;

				successfulIncrement = true;
			}

			if (!successfulIncrement) currEl.currentContainer = null;

			return successfulIncrement;
		}
		TryFollowDefaultInvisibleChoice() {
			var allChoices = this._state.currentChoices;

			// Is a default invisible choice the ONLY choice?
			var invisibleChoices = allChoices.filter(c => {
				return c.choicePoint.isInvisibleDefault;
			});
			if (invisibleChoices.length == 0 || allChoices.length > invisibleChoices.length) return false;

			var choice = invisibleChoices[0];

			this.ChoosePath(choice.choicePoint.choiceTarget.path);

			return true;
		}
		VisitCountForContainer(container) {
			if (!container.visitsShouldBeCounted) {
				console.warn("Read count for target (" + container.name + " - on " + container.debugMetadata + ") unknown. The story may need to be compiled with countAllVisits flag (-c).");
				return 0;
			}

			var count = 0;
			var containerPathStr = container.path.toString();
			count = this.state.visitCounts[containerPathStr] || count;
			return count;
		}
		IncrementVisitCountForContainer(container) {
			var count = 0;
			var containerPathStr = container.path.toString();
			if (this.state.visitCounts[containerPathStr]) count = this.state.visitCounts[containerPathStr];
			count++;
			this.state.visitCounts[containerPathStr] = count;
		}
		RecordTurnIndexVisitToContainer(container) {
			var containerPathStr = container.path.toString();
			this.state.turnIndices[containerPathStr] = this.state.currentTurnIndex;
		}
		TurnsSinceForContainer(container) {
			if (!container.turnIndexShouldBeCounted) {
				this.Error("TURNS_SINCE() for target (" + container.name + " - on " + container.debugMetadata + ") unknown. The story may need to be compiled with countAllVisits flag (-c).");
			}

			var index = 0;
			var containerPathStr = container.path.toString();
			index = this.state.turnIndices[containerPathStr];
			if (this.state.turnIndices[containerPathStr]) {
				return state.currentTurnIndex - index;
			} else {
				return -1;
			}
		}
		/*
	 NextSequenceShuffleIndex
	 */

		Error(message, useEndLineNumber) {
			var e = new Error(message);
			//		e.useEndLineNumber = useEndLineNumber;
			throw e;
		}
		AddError(message, useEndLineNumber) {
			//		var dm = this.currentDebugMetadata;
			var dm = null;

			if (dm != null) {
				var lineNum = useEndLineNumber ? dm.endLineNumber : dm.startLineNumber;
				message = "RUNTIME ERROR: '" + dm.fileName + "' line " + lineNum + ": " + message;
			} else {
				message = "RUNTIME ERROR: " + message;
			}

			this.state.AddError(message);
		}
	}

	exports.Story = Story;

}((this.inkjs = this.inkjs || {})));