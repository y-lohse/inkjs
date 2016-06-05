import {Container} from './Container';
import {Value, IntValue, FloatValue, StringValue, DivertTargetValue, VariablePointerValue} from './Value';
import {Glue, GlueType} from './Glue';
import {ControlCommand} from './ControlCommand';
import {PushPopType} from './PushPop';
import {Divert} from './Divert';
import {ChoicePoint} from './ChoicePoint';
import {VariableReference} from './VariableReference';
import {VariableAssignment} from './VariableAssignment';
import {NativeFunctionCall} from './NativeFunctionCall';
import {Branch} from './Branch';
import {Void} from './Void';
import {Path} from './Path';
import {Object as InkObject} from './Object';

export class JsonSerialisation{
	static ListToJArray(serialisables){
		var jArray = [];
		serialisables.forEach(s => {
			jArray.push(this.RuntimeObjectToJToken(s));
		});
		return jArray;
	}
	static JArrayToRuntimeObjList(jArray, skipLast){
		var count = jArray.length;
		if (skipLast) count--;
		
		var list = [];
		
		for (var i = 0; i < count; i++){
			var jTok = jArray[i];
			var runtimeObj = this.JTokenToRuntimeObject(jTok);
			list.push(runtimeObj);
		}
		
		return list;
	}
	static JObjectToDictionaryRuntimeObjs(jObject){
		var dict = {};

		for (var key in jObject){
			dict[key] = this.JTokenToRuntimeObject(jObject[key]);
		}

		return dict;
	}
	static DictionaryRuntimeObjsToJObject(dictionary){
		var jsonObj = {};

		for (var key in dictionary){
//			var runtimeObj = keyVal.Value as Runtime.Object;
			var runtimeObj = dictionary[key];
			if (runtimeObj instanceof InkObject)
				jsonObj[key] = this.RuntimeObjectToJToken(runtimeObj);
		}

		return jsonObj;
	}
	static JObjectToIntDictionary(jObject){
		var dict = {};
		for (var key in jObject){
			dict[key] = parseInt(jObject[key]);
		}
		return dict;
	}
	static IntDictionaryToJObject(dict){
		var jObj = {};
		for (var key in dict){
			jObj[key] = dict[key];
		}
		return jObj;
	}
	static JTokenToRuntimeObject(token){
		//@TODO probably find a more robust way to detect numbers, isNaN seems happy to accept things that really aren't numberish.
		if (!isNaN(token) && token !== "\n"){//JS thinks "\n" is a number
			return Value.Create(token);
		}
		
		if (typeof token === 'string'){
			var str = token.toString();

			// String value
			var firstChar = str[0];
			if (firstChar == '^')
				return new StringValue(str.substring(1));
			else if(firstChar == "\n" && str.length == 1)
				return new StringValue("\n");

			// Glue
			if (str == "<>")
				return new Glue(GlueType.Bidirectional);
			else if(str == "G<")
				return new Glue(GlueType.Left);
			else if(str == "G>")
				return new Glue(GlueType.Right);

			// Control commands (would looking up in a hash set be faster?)
			for (var i = 0; i < _controlCommandNames.length; ++i) {
				var cmdName = _controlCommandNames[i];
				if (str == cmdName) {
					return new ControlCommand(i);
				}
			}

			// Native functions
			if( NativeFunctionCall.CallExistsWithName(str) )
				return NativeFunctionCall.CallWithName(str);

			// Pop
			if (str == "->->")
				return ControlCommand.PopTunnel();
			else if (str == "~ret")
				return ControlCommand.PopFunction();

			// Void
			if (str == "void")
				return new Void ();
		}
		
		if (typeof token === 'object' && token instanceof Array === false){
			var obj = token;
			var propValue;

			// Divert target value to path
			if (obj["^->"]){
				propValue = obj["^->"];
				return new DivertTargetValue(new Path(propValue.toString()));
			}
				
			// VariablePointerValue
			if (obj["^var"]) {
				propValue = obj["^var"];
				var varPtr = new VariablePointerValue(propValue.toString());
				if (obj["ci"]){
					propValue = obj["ci"];
					varPtr.contextIndex = parseInt(propValue);
				}
				return varPtr;
			}

			// Divert
			var isDivert = false;
			var pushesToStack = false;
			var divPushType = PushPopType.Function;
			var external = false;
			if (propValue = obj["->"]) {
				isDivert = true;
			}
			else if (propValue = obj["f()"]) {
				isDivert = true;
				pushesToStack = true;
				divPushType = PushPopType.Function;
			}
			else if (propValue = obj["->t->"]) {
				isDivert = true;
				pushesToStack = true;
				divPushType = PushPopType.Tunnel;
			}
			else if (propValue = obj["x()"]) {
				isDivert = true;
				external = true;
				pushesToStack = false;
				divPushType = PushPopType.Function;
			}
			
			if (isDivert) {
				var divert = new Divert();
				divert.pushesToStack = pushesToStack;
				divert.stackPushType = divPushType;
				divert.isExternal = external;

				var target = propValue.toString();

				if (propValue = obj["var"])
					divert.variableDivertName = target;
				else
					divert.targetPathString = target;

				if (external) {
					if (propValue = obj["exArgs"])
						divert.externalArgs = parseInt(propValue);
				}

				return divert;
			}

			// Choice
			if (propValue = obj["*"]) {
				var choice = new ChoicePoint();
				choice.pathStringOnChoice = propValue.toString();

				if (propValue = obj["flg"])
					choice.flags = parseInt(propValue);

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

			if (obj["originalChoicePath"] != null)
				return this.JObjectToChoice(obj);
		}
		
		// Array is always a Runtime.Container
		if (token instanceof Array){
			return this.JArrayToContainer(token);
		}
		
		if (token == null)
                return null;
		
		throw "Failed to convert token to runtime object: " + JSON.stringify(token);
	}
	static RuntimeObjectToJToken(obj){
//		var container = obj as Container;
		var container = obj;
		if (container instanceof Container) {
			return this.ContainerToJArray(container);
		}

//		var divert = obj as Divert;
		var divert = obj;
		if (divert instanceof Divert) {
			var divTypeKey = "->";
			if (divert.isExternal)
				divTypeKey = "x()";
			else if (divert.pushesToStack) {
				if (divert.stackPushType == PushPopType.Function)
					divTypeKey = "f()";
				else if (divert.stackPushType == PushPopType.Tunnel)
					divTypeKey = "->t->";
			}

			var targetStr;
			if (divert.hasVariableTarget)
				targetStr = divert.variableDivertName;
			else
				targetStr = divert.targetPathString;

			var jObj = {};
			jObj[divTypeKey] = targetStr;

			if (divert.hasVariableTarget)
				jObj["var"] = true;

			if (divert.externalArgs > 0)
				jObj["exArgs"] = divert.externalArgs;

			return jObj;
		}

//		var choicePoint = obj as ChoicePoint;
		var choicePoint = obj;
		if (choicePoint instanceof ChoicePoint) {
			var jObj = {};
			jObj["*"] = choicePoint.pathStringOnChoice;
			jObj["flg"] = choicePoint.flags;
			return jObj;
		}

//		var intVal = obj as IntValue;
		var intVal = obj;
		if (intVal instanceof IntValue)
			return intVal.value;

//		var floatVal = obj as FloatValue;
		var floatVal = obj;
		if (floatVal instanceof FloatValue)
			return floatVal.value;

//		var strVal = obj as StringValue;
		var strVal = obj;
		if (strVal instanceof StringValue) {
			if (strVal.isNewline)
				return "\n";
			else
				return "^" + strVal.value;
		}

//		var divTargetVal = obj as DivertTargetValue;
		var divTargetVal = obj;
		if (divTargetVal instanceof DivertTargetValue)
			return {
				"^->": divTargetVal.value.componentsString
			};

//		var varPtrVal = obj as VariablePointerValue;
		var varPtrVal = obj;
		if (varPtrVal instanceof VariablePointerValue)
			return {
				"^var": varPtrVal.value,
				"ci": varPtrVal.contextIndex
			};

//		var glue = obj as Runtime.Glue;
		var glue = obj;
		if (glue instanceof Glue) {
			if (glue.isBi)
				return "<>";
			else if (glue.isLeft)
				return "G<";
			else
				return "G>";
		}

//		var controlCmd = obj as ControlCommand;
		var controlCmd = obj;
		if (controlCmd instanceof ControlCommand) {
			return _controlCommandNames[parseInt(controlCmd.commandType)];
		}

//		var nativeFunc = obj as Runtime.NativeFunctionCall;
		var nativeFunc = obj;
		if (nativeFunc instanceof NativeFunctionCall)
			return nativeFunc.name;

		// Variable reference
//		var varRef = obj as VariableReference;
		var varRef = obj;
		if (varRef instanceof VariableReference) {
			var jObj = {};
			var readCountPath = varRef.pathStringForCount;
			if (readCountPath != null) {
				jObj["CNT?"] = readCountPath;
			} else {
				jObj["VAR?"] = varRef.name;
			}

			return jObj;
		}

		// Variable assignment
//		var varAss = obj as VariableAssignment;
		var varAss = obj;
		if (varAss instanceof VariableAssignment) {
			var key = varAss.isGlobal ? "VAR=" : "temp=";
			var jObj = {};
			jObj[key] = varAss.variableName;

			// Reassignment?
			if (!varAss.isNewDeclaration)
				jObj["re"] = true;

			return jObj;
		}

//		var branch = obj as Branch;
		var branch = obj;
		if (branch instanceof Branch) {
			var jObj = {};
			if (branch.trueDivert)
				jObj["t?"] = this.RuntimeObjectToJToken(branch.trueDivert);
			if (branch.falseDivert)
				jObj["f?"] = this.RuntimeObjectToJToken(branch.falseDivert);
			return jObj;
		}

//		var voidObj = obj as Void;
		var voidObj = obj;
		if (voidObj instanceof Void)
			return "void";

		// Used when serialising save state only
//		var choice = obj as Choice;
		var choice = obj;
		if (choice instanceof Choice)
			return this.ChoiceToJObject(choice);

		throw "Failed to convert runtime object to Json token: " + obj;
	}
	static ContainerToJArray(container){
		var jArray = this.ListToJArray(container.content);

		// Container is always an array [...]
		// But the final element is always either:
		//  - a dictionary containing the named content, as well as possibly
		//    the key "#" with the count flags
		//  - null, if neither of the above
		var namedOnlyContent = container.namedOnlyContent;
		var countFlags = container.countFlags;
		if (namedOnlyContent != null && namedOnlyContent.length > 0 || countFlags > 0 || container.name != null) {

			var terminatingObj;
			if (namedOnlyContent != null) {
				terminatingObj = this.DictionaryRuntimeObjsToJObject(namedOnlyContent);

				// Strip redundant names from containers if necessary
				terminatingObj.forEach(namedContentObj => {
//					var subContainerJArray = namedContentObj.Value as JArray;
					var subContainerJArray = namedContentObj.Value;
					if (subContainerJArray != null) {
//						var attrJObj = subContainerJArray [subContainerJArray.Count - 1] as JObject;
						var attrJObj = subContainerJArray[subContainerJArray.length - 1];
						if (attrJObj != null) {
							throw "Cleaning attrJObj not implemented";
//							attrJObj.Remove ("#n");
//							if (attrJObj.Count == 0)
//								subContainerJArray [subContainerJArray.Count - 1] = null;
						}
					}
				});

			} else
				terminatingObj = {};

			if( countFlags > 0 )
				terminatingObj["#f"] = countFlags;

			if( container.name != null )
				terminatingObj["#n"] = container.name;

			jArray.push(terminatingObj);
		} 

		// Add null terminator to indicate that there's no dictionary
		else {
			jArray.push(null);
		}

		return jArray;
	}
	static JArrayToContainer(jArray){
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
			
			for (var key in terminatingObj){
				if (key == "#f") {
					container.countFlags = parseInt(terminatingObj[key]);
				} else if (key == "#n") {
					container.name = terminatingObj[key].toString();
				} else {
					var namedContentItem = this.JTokenToRuntimeObject(terminatingObj[key]);
//					var namedSubContainer = namedContentItem as Container;
					var namedSubContainer = namedContentItem;
					if (namedSubContainer instanceof Container)
						namedSubContainer.name = key;
					namedOnlyContent[key] = namedContentItem;
				}
			}

			container.namedOnlyContent = namedOnlyContent;
		}

		return container;
	}
	JObjectToChoice(jObj){
		var choice = new Choice();
		choice.text = jObj["text"].toString();
		choice.index = parseInt(jObj["index"]);
		choice.originalChoicePath = jObj["originalChoicePath"].toString();
		choice.originalThreadIndex = parseInt(jObj["originalThreadIndex"]);
		return choice;
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

for (var i = 0; i < ControlCommand.CommandType.TOTAL_VALUES; ++i) {
	if (_controlCommandNames[i] == null)
		throw "Control command not accounted for in serialisation";
}