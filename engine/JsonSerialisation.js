import {Container} from './Container';
import {StringValue} from './Value';

export class JsonSerialisation{
	static ListToJArray(){
		
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
	static DictionaryRuntimeObjsToJObject(){
		
	}
	static JObjectToDictionaryRuntimeObjs(){
		
	}
	static JObjectToIntDictionary(){
		
	}
	static IntDictionaryToJObject(){
		
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
//			// Control commands (would looking up in a hash set be faster?)
//			for (int i = 0; i < _controlCommandNames.Length; ++i) {
//				string cmdName = _controlCommandNames [i];
//				if (str == cmdName) {
//					return new Runtime.ControlCommand ((ControlCommand.CommandType)i);
//				}
//			}
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
	static RuntimeObjectToJToken(){
		
	}
	static ContainerToJArray(){
		
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
	static JObjectToChoice(){
		
	}
	static ChoiceToJObject(){
		
	}
	static Json(){
		
	}
	static _controlCommandNames(){
		
	}
}