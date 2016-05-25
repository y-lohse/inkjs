import {Container} from './Container';
import {StringValue} from './Value';
import {ControlCommand} from './ControlCommand';

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
	static JTokenToRuntimeObject(token){
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
//		if (terminatingObj != null) {
//
//			var namedOnlyContent = new Dictionary<string, Runtime.Object> (terminatingObj.Count);
//
//			foreach (var keyVal in terminatingObj) {
//				if (keyVal.Key == "#f") {
//					container.countFlags = keyVal.Value.ToObject<int> ();
//				} else if (keyVal.Key == "#n") {
//					container.name = keyVal.Value.ToString ();
//				} else {
//					var namedContentItem = JTokenToRuntimeObject(keyVal.Value);
//					var namedSubContainer = namedContentItem as Container;
//					if (namedSubContainer)
//						namedSubContainer.name = keyVal.Key;
//					namedOnlyContent [keyVal.Key] = namedContentItem;
//				}
//			}
//
//			container.namedOnlyContent = namedOnlyContent;
//		}

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