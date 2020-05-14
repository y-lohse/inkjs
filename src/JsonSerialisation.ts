import {Container} from './Container';
import {Value, IntValue, FloatValue, StringValue, DivertTargetValue, VariablePointerValue, ListValue} from './Value';
import {Glue} from './Glue';
import {ControlCommand} from './ControlCommand';
import {PushPopType} from './PushPop';
import {Divert} from './Divert';
import {ChoicePoint} from './ChoicePoint';
import {VariableReference} from './VariableReference';
import {VariableAssignment} from './VariableAssignment';
import {NativeFunctionCall} from './NativeFunctionCall';
import {Void} from './Void';
import {Tag} from './Tag';
import {Path} from './Path';
import {Choice} from './Choice';
import {ListDefinition} from './ListDefinition';
import {ListDefinitionsOrigin} from './ListDefinitionsOrigin';
import {InkListItem, InkList} from './InkList';
import {InkObject} from './Object';
import {JObject} from './JObject';
import {asOrNull, asNumberOrThrows} from './TypeAssertion';
import {throwNullException} from './NullException';
import { SimpleJson } from './SimpleJson';

// tslint:disable no-conditional-assignment

export class JsonSerialisation{
	public static JArrayToRuntimeObjList(jArray: any[], skipLast: boolean = false){
		let count = jArray.length;
		if (skipLast)
			count--;

		let list: InkObject[] = [];

		for (let i = 0; i < count; i++){
			let jTok = jArray[i];
			let runtimeObj = this.JTokenToRuntimeObject(jTok);
			if (runtimeObj === null) { return throwNullException('runtimeObj'); }
			list.push(runtimeObj);
		}

		return list;
	}

	public static WriteDictionaryRuntimeObjs(writer: SimpleJson.Writer, dictionary: Map<string, InkObject>){
		writer.WriteObjectStart();
		for (let [key, value] of dictionary){
			writer.WritePropertyStart(key);
			this.WriteRuntimeObject(writer, value);
			writer.WritePropertyEnd();
		}
		writer.WriteObjectEnd();
	}

	public static WriteListRuntimeObjs(writer: SimpleJson.Writer, list: InkObject[]){
		writer.WriteArrayStart();
		for (let value of list){
			this.WriteRuntimeObject(writer, value);
		}
		writer.WriteArrayEnd();
	}

	public static WriteIntDictionary(writer: SimpleJson.Writer, dict: Map<string, number>){
		writer.WriteObjectStart();
		for (let [key, value] of dict){
			writer.WriteIntProperty(key, value);
		}
		writer.WriteObjectEnd();
	}

	public static WriteRuntimeObject(writer: SimpleJson.Writer, obj: InkObject): void{
		let container = asOrNull(obj, Container);
		if (container) {
			this.WriteRuntimeContainer(writer, container);
			return;
		}

		let divert = asOrNull(obj, Divert);
		if (divert) {
			let divTypeKey = '->';
			if (divert.isExternal)
				divTypeKey = 'x()';
			else if (divert.pushesToStack) {
				if (divert.stackPushType == PushPopType.Function)
					divTypeKey = 'f()';
				else if (divert.stackPushType == PushPopType.Tunnel)
					divTypeKey = '->t->';
			}

			let targetStr;
			if (divert.hasVariableTarget)
				targetStr = divert.variableDivertName;
			else
				targetStr = divert.targetPathString;

			writer.WriteObjectStart();
			writer.WriteProperty(divTypeKey, targetStr);

			if (divert.hasVariableTarget)
				writer.WriteProperty('var', true);

			if (divert.isConditional)
				writer.WriteProperty('c', true);

			if (divert.externalArgs > 0)
				writer.WriteIntProperty('exArgs', divert.externalArgs);

			writer.WriteObjectEnd();
			return;
		}

		let choicePoint = asOrNull(obj, ChoicePoint);
		if (choicePoint) {
			writer.WriteObjectStart();
			writer.WriteProperty('*', choicePoint.pathStringOnChoice);
			writer.WriteIntProperty('flg', choicePoint.flags);
			writer.WriteObjectEnd();
			return;
		}

		let intVal = asOrNull(obj, IntValue);
		if (intVal) {
			writer.WriteInt(intVal.value);
			return;
		}

		let floatVal = asOrNull(obj, FloatValue);
		if (floatVal) {
			writer.WriteFloat(floatVal.value);
			return;
		}

		let strVal = asOrNull(obj, StringValue);
		if (strVal) {
			if (strVal.isNewline) {
				writer.Write('\n', false);
			} else {
				writer.WriteStringStart();
				writer.WriteStringInner('^');
				writer.WriteStringInner(strVal.value);
				writer.WriteStringEnd();
			}
			return;
		}

		let listVal = asOrNull(obj, ListValue);
		if (listVal) {
			this.WriteInkList(writer, listVal);
			return;
		}

		let divTargetVal = asOrNull(obj, DivertTargetValue);
		if (divTargetVal) {
			writer.WriteObjectStart();
			if (divTargetVal.value === null) { return throwNullException('divTargetVal.value'); }
			writer.WriteProperty('^->', divTargetVal.value.componentsString);
			writer.WriteObjectEnd();

			return;
		}

		let varPtrVal = asOrNull(obj, VariablePointerValue);
		if (varPtrVal) {
			writer.WriteObjectStart();
			writer.WriteProperty('^var', varPtrVal.value);
			writer.WriteIntProperty('ci', varPtrVal.contextIndex);
			writer.WriteObjectEnd();
			return;
		}

		let glue = asOrNull(obj, Glue);
		if (glue) {
			writer.Write('<>');
			return;
		}

		let controlCmd = asOrNull(obj, ControlCommand);
		if (controlCmd) {
			writer.Write(JsonSerialisation._controlCommandNames[controlCmd.commandType]);
			return;
		}

		let nativeFunc = asOrNull(obj, NativeFunctionCall);
		if (nativeFunc) {
			let name = nativeFunc.name;

			if (name == '^') name = 'L^';

			writer.Write(name);
			return;
		}

		let varRef = asOrNull(obj, VariableReference);
		if (varRef) {
			writer.WriteObjectStart();
			let readCountPath = varRef.pathStringForCount;
			if (readCountPath != null) {
				writer.WriteProperty('CNT?', readCountPath);
			} else {
				writer.WriteProperty('VAR?', varRef.name);
			}

			writer.WriteObjectEnd();
			return;
		}

		let varAss = asOrNull(obj, VariableAssignment);
		if (varAss) {
			writer.WriteObjectStart();

			let key = varAss.isGlobal ? 'VAR=' : 'temp=';
			writer.WriteProperty(key, varAss.variableName);

			// Reassignment?
			if (!varAss.isNewDeclaration)
				writer.WriteProperty('re', true);

			writer.WriteObjectEnd();

			return;
		}

		let voidObj = asOrNull(obj, Void);
		if (voidObj) {
			writer.Write('void');
			return;
		}

		let tag = asOrNull(obj, Tag);
		if (tag) {
			writer.WriteObjectStart();
			writer.WriteProperty('#', tag.text);
			writer.WriteObjectEnd();
			return;
		}

		let choice = asOrNull(obj, Choice);
		if (choice) {
			this.WriteChoice(writer, choice);
			return;
		}

		throw new Error('Failed to convert runtime object to Json token: ' + obj);
	}

	public static JObjectToDictionaryRuntimeObjs(jObject: JObject){
		let dict: Map<string, InkObject> = new Map();

		for (let key in jObject){
			if (jObject.hasOwnProperty(key)) {
				let inkObject = this.JTokenToRuntimeObject(jObject[key]);
				if (inkObject === null) { return throwNullException('inkObject'); }
				dict.set(key, inkObject);
			}
		}

		return dict;
	}

	public static JObjectToIntDictionary(jObject: JObject){
		let dict: Map<string, number> = new Map();
		for (let key in jObject){
			if (jObject.hasOwnProperty(key)) {
				dict.set(key, parseInt(jObject[key]));
			}
		}
		return dict;
	}

	public static JTokenToRuntimeObject(token: any): InkObject | null {
		if (typeof token === 'number' && !isNaN(token)){
			return Value.Create(token);
		}

		if (typeof token === 'string'){
			let str = token.toString();

			// String value
			let firstChar = str[0];
			if (firstChar == '^')
				return new StringValue(str.substring(1));
			else if(firstChar == '\n' && str.length == 1)
				return new StringValue('\n');

			// Glue
			if (str == '<>') return new Glue();

			// Control commands (would looking up in a hash set be faster?)
			for (let i = 0; i < JsonSerialisation._controlCommandNames.length; ++i) {
				let cmdName = JsonSerialisation._controlCommandNames[i];
				if (str == cmdName) {
					return new ControlCommand(i);
				}
			}

			// Native functions
			if (str == 'L^') str = '^';
			if( NativeFunctionCall.CallExistsWithName(str) )
				return NativeFunctionCall.CallWithName(str);

			// Pop
			if (str == '->->')
				return ControlCommand.PopTunnel();
			else if (str == '~ret')
				return ControlCommand.PopFunction();

			// Void
			if (str == 'void')
				return new Void ();
		}

		if (typeof token === 'object' && !Array.isArray(token)){
			let obj: JObject = token;
			let propValue;

			// Divert target value to path
			if (obj['^->']){
				propValue = obj['^->'];
				return new DivertTargetValue(new Path(propValue.toString()));
			}

			// VariablePointerValue
			if (obj['^var']) {
				propValue = obj['^var'];
				let varPtr = new VariablePointerValue(propValue.toString());
				if ('ci' in obj){
					propValue = obj['ci'];
					varPtr.contextIndex = parseInt(propValue);
				}
				return varPtr;
			}

			// Divert
			let isDivert = false;
			let pushesToStack = false;
			let divPushType = PushPopType.Function;
			let external = false;
			if (propValue = obj['->']) {
				isDivert = true;
			}
			else if (propValue = obj['f()']) {
				isDivert = true;
				pushesToStack = true;
				divPushType = PushPopType.Function;
			}
			else if (propValue = obj['->t->']) {
				isDivert = true;
				pushesToStack = true;
				divPushType = PushPopType.Tunnel;
			}
			else if (propValue = obj['x()']) {
				isDivert = true;
				external = true;
				pushesToStack = false;
				divPushType = PushPopType.Function;
			}

			if (isDivert) {
				let divert = new Divert();
				divert.pushesToStack = pushesToStack;
				divert.stackPushType = divPushType;
				divert.isExternal = external;

				let target = propValue.toString();

				if (propValue = obj['var'])
					divert.variableDivertName = target;
				else
					divert.targetPathString = target;

				divert.isConditional = !!obj['c'];

				if (external) {
					if (propValue = obj['exArgs'])
						divert.externalArgs = parseInt(propValue);
				}

				return divert;
			}

			// Choice
			if (propValue = obj['*']) {
				let choice = new ChoicePoint();
				choice.pathStringOnChoice = propValue.toString();

				if (propValue = obj['flg'])
					choice.flags = parseInt(propValue);

				return choice;
			}

			// Variable reference
			if (propValue = obj['VAR?']) {
				return new VariableReference(propValue.toString());
			} else if (propValue = obj['CNT?']) {
				let readCountVarRef = new VariableReference();
				readCountVarRef.pathStringForCount = propValue.toString();
				return readCountVarRef;
			}

			// Variable assignment
			let isVarAss = false;
			let isGlobalVar = false;
			if (propValue = obj['VAR=']) {
				isVarAss = true;
				isGlobalVar = true;
			} else if (propValue = obj['temp=']) {
				isVarAss = true;
				isGlobalVar = false;
			}
			if (isVarAss) {
				let varName = propValue.toString();
				let isNewDecl = !obj['re'];
				let varAss = new VariableAssignment(varName, isNewDecl);
				varAss.isGlobal = isGlobalVar;
				return varAss;
			}
			if (obj['#'] !== undefined){
				propValue = obj['#'];
				return new Tag(propValue.toString());
			}

			// List value
			if (propValue = obj['list']) {
				// var listContent = (Dictionary<string, object>)propValue;
				let listContent: JObject = propValue;
				let rawList = new InkList();
				if (propValue = obj['origins']) {
					// var namesAsObjs = (List<object>)propValue;
					let namesAsObjs = propValue as string[];
					// rawList.SetInitialOriginNames(namesAsObjs.Cast<string>().ToList());
					rawList.SetInitialOriginNames(namesAsObjs);
				}

				for (let key in listContent){
					if (listContent.hasOwnProperty(key)) {
						let nameToVal = listContent[key];
						let item = new InkListItem(key);
						let val = parseInt(nameToVal);
						rawList.Add(item, val);
					}
				}

				return new ListValue(rawList);
			}

			if (obj['originalChoicePath'] != null)
				return this.JObjectToChoice(obj);
		}

		// Array is always a Runtime.Container
		if (Array.isArray(token)){
			return this.JArrayToContainer(token);
		}

		if (token === null || token === undefined)
			return null;

		throw new Error('Failed to convert token to runtime object: ' + JSON.stringify(token));
	}

	public static WriteRuntimeContainer(writer: SimpleJson.Writer, container: Container | null, withoutName: boolean = false){
		writer.WriteArrayStart();
		if (container === null) { return throwNullException('container'); }
		for (let c of container.content)
			this.WriteRuntimeObject(writer, c);

		let namedOnlyContent = container.namedOnlyContent;
		let countFlags = container.countFlags;
		let hasNameProperty = container.name != null && !withoutName;

		let hasTerminator = (namedOnlyContent != null || countFlags > 0 || hasNameProperty);
		if (hasTerminator) {
			writer.WriteObjectStart();
		}

		if (namedOnlyContent != null) {
			for (let [key, value] of namedOnlyContent){
				let name = key;
				let namedContainer = asOrNull(value, Container);
				writer.WritePropertyStart(name);
				this.WriteRuntimeContainer(writer, namedContainer, true);
				writer.WritePropertyEnd();
			}
		}

		if (hasNameProperty)
			writer.WriteProperty('#n', container.name);

		if (hasTerminator)
			writer.WriteObjectEnd();
		else
			writer.WriteNull();

		writer.WriteArrayEnd();
	}

	public static JArrayToContainer(jArray: any[]){
		let container = new Container();
		container.content = this.JArrayToRuntimeObjList(jArray, true);

		let terminatingObj = jArray[jArray.length - 1] as JObject;
		if (terminatingObj != null) {

			let namedOnlyContent = new Map();

			for (let key in terminatingObj){
				if (key == '#f') {
					container.countFlags = parseInt(terminatingObj[key]);
				} else if (key == '#n') {
					container.name = terminatingObj[key].toString();
				} else {
					let namedContentItem = this.JTokenToRuntimeObject(terminatingObj[key]);
					// var namedSubContainer = namedContentItem as Container;
					let namedSubContainer = asOrNull(namedContentItem, Container);
					if (namedSubContainer)
						namedSubContainer.name = key;
					namedOnlyContent.set(key, namedContentItem);
				}
			}

			container.namedOnlyContent = namedOnlyContent;
		}

		return container;
	}

	public static JObjectToChoice(jObj: JObject){
		let choice = new Choice();
		choice.text = jObj['text'].toString();
		choice.index = parseInt(jObj['index']);
		choice.sourcePath = jObj['originalChoicePath'].toString();
		choice.originalThreadIndex = parseInt(jObj['originalThreadIndex']);
		choice.pathStringOnChoice = jObj['targetPath'].toString();
		return choice;
	}

	public static WriteChoice(writer: SimpleJson.Writer, choice: Choice){
		writer.WriteObjectStart();
		writer.WriteProperty('text', choice.text);
		writer.WriteIntProperty('index', choice.index);
		writer.WriteProperty('originalChoicePath', choice.sourcePath);
		writer.WriteIntProperty('originalThreadIndex', choice.originalThreadIndex);
		writer.WriteProperty('targetPath', choice.pathStringOnChoice);
		writer.WriteObjectEnd();
	}

	public static WriteInkList(writer: SimpleJson.Writer, listVal: ListValue){
		let rawList = listVal.value;
		if (rawList === null) { return throwNullException('rawList'); }

		writer.WriteObjectStart();
		writer.WritePropertyStart('list');
		writer.WriteObjectStart();

		for (let [key, val] of rawList) {
			let item = InkListItem.fromSerializedKey(key);
			let itemVal = val;

			if (item.itemName === null) { return throwNullException('item.itemName'); }

			writer.WritePropertyNameStart();
			writer.WritePropertyNameInner(item.originName ? item.originName : '?');
			writer.WritePropertyNameInner('.');
			writer.WritePropertyNameInner(item.itemName);
			writer.WritePropertyNameEnd();

			writer.Write(itemVal);

			writer.WritePropertyEnd();
		}

		writer.WriteObjectEnd();

		writer.WritePropertyEnd();

		if (rawList.Count == 0 && rawList.originNames != null && rawList.originNames.length > 0)
		{
			writer.WritePropertyStart('origins');
			writer.WriteArrayStart();
			for (let name of rawList.originNames)
				writer.Write(name);
			writer.WriteArrayEnd();
			writer.WritePropertyEnd();
		}
	}

	public static ListDefinitionsToJToken(origin: ListDefinitionsOrigin){
		let result: JObject = {};

		for (let def of origin.lists) {
			let listDefJson: JObject = {};

			for (let [key, val] of def.items) {
				let item = InkListItem.fromSerializedKey(key);
				if (item.itemName === null) { return throwNullException('item.itemName'); }
				listDefJson[item.itemName] = val;
			}

			result[def.name] = listDefJson;
		}

		return result;
	}

	public static JTokenToListDefinitions(obj: JObject){
		// var defsObj = (Dictionary<string, object>)obj;
		let defsObj = obj;

		let allDefs: ListDefinition[] = [];

		for (let key in defsObj){
			if (defsObj.hasOwnProperty(key)) {
				let name = key.toString();
				// var listDefJson = (Dictionary<string, object>)kv.Value;
				let listDefJson: JObject = defsObj[key];

				// Cast (string, object) to (string, int) for items
				let items: Map<string, number> = new Map();

				for (let nameValueKey in listDefJson){
					if (defsObj.hasOwnProperty(key)) {
						let nameValue = listDefJson[nameValueKey];
						items.set(nameValueKey, parseInt(nameValue));
					}
				}

				let def = new ListDefinition(name, items);
				allDefs.push(def);
			}
		}

		return new ListDefinitionsOrigin(allDefs);
	}

	private static _controlCommandNames = (() => {
		let _controlCommandNames: string[] = [];

		_controlCommandNames[ControlCommand.CommandType.EvalStart] = 'ev';
		_controlCommandNames[ControlCommand.CommandType.EvalOutput] = 'out';
		_controlCommandNames[ControlCommand.CommandType.EvalEnd] = '/ev';
		_controlCommandNames[ControlCommand.CommandType.Duplicate] = 'du';
		_controlCommandNames[ControlCommand.CommandType.PopEvaluatedValue] = 'pop';
		_controlCommandNames[ControlCommand.CommandType.PopFunction] = '~ret';
		_controlCommandNames[ControlCommand.CommandType.PopTunnel] = '->->';
		_controlCommandNames[ControlCommand.CommandType.BeginString] = 'str';
		_controlCommandNames[ControlCommand.CommandType.EndString] = '/str';
		_controlCommandNames[ControlCommand.CommandType.NoOp] = 'nop';
		_controlCommandNames[ControlCommand.CommandType.ChoiceCount] = 'choiceCnt';
		_controlCommandNames[ControlCommand.CommandType.Turns] = 'turn';
		_controlCommandNames[ControlCommand.CommandType.TurnsSince] = 'turns';
		_controlCommandNames[ControlCommand.CommandType.ReadCount] = 'readc';
		_controlCommandNames[ControlCommand.CommandType.Random] = 'rnd';
		_controlCommandNames[ControlCommand.CommandType.SeedRandom] = 'srnd';
		_controlCommandNames[ControlCommand.CommandType.VisitIndex] = 'visit';
		_controlCommandNames[ControlCommand.CommandType.SequenceShuffleIndex] = 'seq';
		_controlCommandNames[ControlCommand.CommandType.StartThread] = 'thread';
		_controlCommandNames[ControlCommand.CommandType.Done] = 'done';
		_controlCommandNames[ControlCommand.CommandType.End] = 'end';
		_controlCommandNames[ControlCommand.CommandType.ListFromInt] = 'listInt';
		_controlCommandNames[ControlCommand.CommandType.ListRange] = 'range';
		_controlCommandNames[ControlCommand.CommandType.ListRandom] = 'lrnd';

		for (let i = 0; i < ControlCommand.CommandType.TOTAL_VALUES; ++i) {
			if (_controlCommandNames[i] == null)
				throw new Error('Control command not accounted for in serialisation');
		}

		return _controlCommandNames;
	})();
}
