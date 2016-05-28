import {Container} from './Container';
import {Value, StringValue} from './Value';
import {ControlCommand} from './ControlCommand';
import {PushPopType} from './PushPop';
import {Divert} from './Divert';
import {ChoicePoint} from './ChoicePoint';
import {Object as InkObject} from './Object';

export class JsonSerialisation{
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
	static JTokenToRuntimeObject(token){
		if (!isNaN(token)){
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
//			if (str == "<>")
//				return new Runtime.Glue (GlueType.Bidirectional);
//			else if(str == "G<")
//				return new Runtime.Glue (GlueType.Left);
//			else if(str == "G>")
//				return new Runtime.Glue (GlueType.Right);
//
			// Control commands (would looking up in a hash set be faster?)
			for (var i = 0; i < _controlCommandNames.length; ++i) {
				var cmdName = _controlCommandNames[i];
				if (str == cmdName) {
					return new ControlCommand(i);
				}
			}
//
//			// Native functions
//			if( NativeFunctionCall.CallExistsWithName(str) )
//				return NativeFunctionCall.CallWithName (str);
//
//			// Pop
//			if (str == "->->")
//				return Runtime.ControlCommand.PopTunnel ();
//			else if (str == "~ret")
//				return Runtime.ControlCommand.PopFunction ();
//
//			// Void
//			if (str == "void")
//				return new Runtime.Void ();
		}
		
		if (typeof token === 'object' && token instanceof Array === false){
			var obj = token;
			var propValue;

			// Divert target value to path
//			if (obj.TryGetValue ("^->", out propValue))
//				return new DivertTargetValue (new Path (propValue.ToString()));

			// VariablePointerValue
//			if (obj.TryGetValue ("^var", out propValue)) {
//				var varPtr = new VariablePointerValue (propValue.ToString ());
//				if (obj.TryGetValue ("ci", out propValue))
//					varPtr.contextIndex = propValue.ToObject<int> ();
//				return varPtr;
//			}

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
//
//			// Variable reference
//			if (obj.TryGetValue ("VAR?", out propValue)) {
//				return new VariableReference (propValue.ToString ());
//			} else if (obj.TryGetValue ("CNT?", out propValue)) {
//				var readCountVarRef = new VariableReference ();
//				readCountVarRef.pathStringForCount = propValue.ToString ();
//				return readCountVarRef;
//			}
//
//			// Variable assignment
//			bool isVarAss = false;
//			bool isGlobalVar = false;
//			if (obj.TryGetValue ("VAR=", out propValue)) {
//				isVarAss = true;
//				isGlobalVar = true;
//			} else if (obj.TryGetValue ("temp=", out propValue)) {
//				isVarAss = true;
//				isGlobalVar = false;
//			}
//			if (isVarAss) {
//				var varName = propValue.ToString ();
//				var isNewDecl = !obj.TryGetValue("re", out propValue);
//				var varAss = new VariableAssignment (varName, isNewDecl);
//				varAss.isGlobal = isGlobalVar;
//				return varAss;
//			}
//
//			Divert trueDivert = null;
//			Divert falseDivert = null;
//			if (obj.TryGetValue ("t?", out propValue)) {
//				trueDivert = JTokenToRuntimeObject(propValue) as Divert;
//			}
//			if (obj.TryGetValue ("f?", out propValue)) {
//				falseDivert = JTokenToRuntimeObject(propValue) as Divert;
//			}
//			if (trueDivert || falseDivert) {
//				return new Branch (trueDivert, falseDivert);
//			}
//
//			if (obj ["originalChoicePath"] != null)
//				return JObjectToChoice (obj);
		}
		
		// Array is always a Runtime.Container
		if (token instanceof Array){
			return this.JArrayToContainer(token);
		}
		
		if (token == null)
                return null;
		
		throw "Failed to convert token to runtime object: " + JSON.stringify(token);
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