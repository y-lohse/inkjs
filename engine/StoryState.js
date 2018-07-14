import {CallStack} from './CallStack';
import {VariablesState} from './VariablesState';
import {ValueType, Value, StringValue, ListValue} from './Value';
import {PushPopType} from './PushPop';
import {Tag} from './Tag';
import {Glue} from './Glue';
import {Path} from './Path';
import {ControlCommand} from './ControlCommand';
import {StoryException} from './StoryException';
import {StringBuilder} from './StringBuilder';
import {JsonSerialisation} from './JsonSerialisation';
import {Story} from './Story';
import {PRNG} from './PRNG';
import {Void} from './Void';
import {Pointer} from './Pointer';

export class StoryState{
	constructor(story){
		//actual constructor
		this.story = story;

		this._outputStream = [];
		this._outputStreamTextDirty = true;
		this._outputStreamTagsDirty = true;
		this.OutputStreamDirty();

		this._evaluationStack = [];

		this.callStack = new CallStack(story.rootContentContainer);
		this._variablesState = new VariablesState(this.callStack, story.listDefinitions);

		this._visitCounts = {};
		this._turnIndices = {};
		this._currentTurnIndex = -1;

		this.divertedPointer = Pointer.Null;

		var timeSeed = (new Date()).getTime();
		this.storySeed = (new PRNG(timeSeed)).next() % 100;
		this.previousRandom = 0;

		this._currentChoices = [];
		this._currentText = null;
		this._currentTags = null;
		this._currentErrors = null;
		this._currentWarnings = null;

		this.didSafeExit = false;

		this.GoToStart();
	}
	get currentChoices(){
		// If we can continue generating text content rather than choices,
		// then we reflect the choice list as being empty, since choices
		// should always come at the end.
		if ( this.canContinue ) return [];
		return this._currentChoices;
	}
	get generatedChoices(){
		return this._currentChoices;
	}
	get currentErrors(){
		return this._currentErrors;
	}
	get currentWarnings(){
		return this._currentWarnings;
	}
	get visitCounts(){
		return this._visitCounts;
	}
	get turnIndices(){
		return this._turnIndices;
	}
	get currentTurnIndex(){
		return this._currentTurnIndex;
	}
	get variablesState(){
		return this._variablesState;
	}
	get currentContentObject(){
		return this.callStack.currentElement.currentObject;
	}
	set currentContentObject(value){
		this.callStack.currentElement.currentObject = value;
	}
	get canContinue(){
		return !this.currentPointer.isNull && !this.hasError;
	}
	get hasError(){
		return this.currentErrors != null && this.currentErrors.length > 0;
	}
	get hasWarning(){
		return this.currentWarnings != null && this.currentWarnings.length > 0;
	}
	get inExpressionEvaluation(){
		return this.callStack.currentElement.inExpressionEvaluation;
	}
	set inExpressionEvaluation(value){
		this.callStack.currentElement.inExpressionEvaluation = value;
	}
	get evaluationStack(){
		return this._evaluationStack;
	}
	get outputStreamEndsInNewline(){
		if (this._outputStream.length > 0) {

			for (var i = this._outputStream.length - 1; i >= 0; i--) {
				var obj = this._outputStream[i];
				if (obj instanceof ControlCommand) // e.g. BeginString
					break;
				var text = this._outputStream[i];
				if (text instanceof StringValue) {
					if (text.isNewline)
						return true;
					else if (text.isNonWhitespace)
						break;
				}
			}
		}

		return false;
	}
	get outputStreamContainsContent(){
		for (var i = 0; i < this._outputStream.length; i++){
			if (this._outputStream[i] instanceof StringValue)
				return true;
		}
		return false;
	}
	get inStringEvaluation(){
		for (var i = this._outputStream.length - 1; i >= 0; i--) {
//			var cmd = this._outputStream[i] as ControlCommand;
			var cmd = this._outputStream[i];
			if (cmd instanceof ControlCommand && cmd.commandType == ControlCommand.CommandType.BeginString) {
				return true;
			}
		}

		return false;
	}
	get currentText(){
		if( this._outputStreamTextDirty ) {
			var sb = new StringBuilder();

			this._outputStream.forEach(outputObj => {
	//			var textContent = outputObj as StringValue;
				var textContent = outputObj;
				if (textContent instanceof StringValue) {
					sb.Append(textContent.value);
				}
			});

			this._currentText = this.CleanOutputWhitespace(sb.toString());
			this._outputStreamTextDirty = false;
		}

		return this._currentText;
	}
	get currentTags(){
		if( this._outputStreamTagsDirty ) {
			this._currentTags = [];

			this._outputStream.forEach(outputObj => {
	//			var tag = outputObj as Tag;
				var tag = outputObj;
				if (tag instanceof Tag) {
					this._currentTags.push(tag.text);
				}
			});

			this._outputStreamTagsDirty = false;
		}

		return this._currentTags;
	}
	get outputStream(){
		return this._outputStream;
	}
	get currentPathString(){
		var pointer = this.currentPointer;
		if (pointer.isNull)
			return null;
		else
			return pointer.path.toString();
	}
	get currentPointer(){
		return this.callStack.currentElement.currentPointer.copy();
	}
	set currentPointer(value){
		this.callStack.currentElement.currentPointer = value.copy();
	}
	get previousPointer(){
		return this.callStack.currentThread.previousPointer.copy();
	}
	set previousPointer(value){
		this.callStack.currentThread.previousPointer = value.copy();
	}
	get callstackDepth(){
		return this.callStack.depth;
	}
	get jsonToken(){
		var obj = {};

		var choiceThreads = null;
		this._currentChoices.forEach(c => {
			c.originalThreadIndex = c.threadAtGeneration.threadIndex;

			if( this.callStack.ThreadWithIndex(c.originalThreadIndex) == null ) {
				if( choiceThreads == null )
					choiceThreads = {};

				choiceThreads[c.originalThreadIndex.toString()] = c.threadAtGeneration.jsonToken;
			}
		});

		if( this.choiceThreads != null )
			obj["choiceThreads"] = this.choiceThreads;


		obj["callstackThreads"] = this.callStack.GetJsonToken();
		obj["variablesState"] = this.variablesState.jsonToken;

		obj["evalStack"] = JsonSerialisation.ListToJArray(this.evaluationStack);

		obj["outputStream"] = JsonSerialisation.ListToJArray(this._outputStream);

		obj["currentChoices"] = JsonSerialisation.ListToJArray(this._currentChoices);

		if(!this.divertedPointer.isNull)
			obj["currentDivertTarget"] = this.divertedPointer.path.componentsString;

		obj["visitCounts"] = JsonSerialisation.IntDictionaryToJObject(this.visitCounts);
		obj["turnIndices"] = JsonSerialisation.IntDictionaryToJObject(this.turnIndices);
		obj["turnIdx"] = this.currentTurnIndex;
		obj["storySeed"] = this.storySeed;

		obj["inkSaveVersion"] = StoryState.kInkSaveStateVersion;

		// Not using this right now, but could do in future.
		obj["inkFormatVersion"] = this.story.inkVersionCurrent;

		return obj;
	}
	set jsonToken(value){
		var jObject = value;

		var jSaveVersion = jObject["inkSaveVersion"];
		if (jSaveVersion == null) {
			throw new StoryException("ink save format incorrect, can't load.");
		}
		else if (parseInt(jSaveVersion) < StoryState.kMinCompatibleLoadVersion) {
			throw new StoryException("Ink save format isn't compatible with the current version (saw '"+jSaveVersion+"', but minimum is "+StoryState.kMinCompatibleLoadVersion+"), so can't load.");
		}

		this.callStack.SetJsonToken(jObject["callstackThreads"], this.story);
		this.variablesState.jsonToken = jObject["variablesState"];

		this._evaluationStack = JsonSerialisation.JArrayToRuntimeObjList(jObject["evalStack"]);

		this._outputStream = JsonSerialisation.JArrayToRuntimeObjList(jObject["outputStream"]);
		this.OutputStreamDirty();

//		currentChoices = Json.JArrayToRuntimeObjList<Choice>((JArray)jObject ["currentChoices"]);
		this._currentChoices = JsonSerialisation.JArrayToRuntimeObjList(jObject["currentChoices"]);

		var currentDivertTargetPath = jObject["currentDivertTarget"];
		if (currentDivertTargetPath != null) {
			var divertPath = new Path(currentDivertTargetPath.toString());
			this.divertedPointer = this.story.PointerAtPath(divertPath);
		}

		this._visitCounts = JsonSerialisation.JObjectToIntDictionary(jObject["visitCounts"]);
		this._turnIndices = JsonSerialisation.JObjectToIntDictionary(jObject["turnIndices"]);
		this._currentTurnIndex = parseInt(jObject["turnIdx"]);
		this.storySeed = parseInt(jObject["storySeed"]);

//		var jChoiceThreads = jObject["choiceThreads"] as JObject;
		var jChoiceThreads = jObject["choiceThreads"];

		this._currentChoices.forEach(c => {
			var foundActiveThread = this.callStack.ThreadWithIndex(c.originalThreadIndex);
			if( foundActiveThread != null ) {
				c.threadAtGeneration = foundActiveThread;
			} else {
				var jSavedChoiceThread = jChoiceThreads[c.originalThreadIndex.toString()];
				c.threadAtGeneration = new CallStack.Thread(jSavedChoiceThread, this.story);
			}
		});
	}

	CleanOutputWhitespace (str){
		var sb = new StringBuilder();

		var currentWhitespaceStart = -1;

		for (var i = 0; i < str.length; i++) {
			var c = str.charAt(i);

			var isInlineWhitespace = (c == ' ') || (c == '\t');

			if (isInlineWhitespace && currentWhitespaceStart == -1)
				currentWhitespaceStart = i;

			if (!isInlineWhitespace) {
				if (c != '\n' && currentWhitespaceStart > 0) {
					sb.Append(str.substr(currentWhitespaceStart, i - currentWhitespaceStart));
				}
				currentWhitespaceStart = -1;
			}

			if (!isInlineWhitespace)
				sb.Append(c);
		}

		return sb.toString();
	}

	GoToStart(){
		this.callStack.currentElement.currentPointer = Pointer.StartOf(this.story.mainContentContainer);
	}
	ResetErrors(){
		this._currentErrors = null;
		this._currentWarnings = null;
	}
	ResetOutput(objs){
		objs = (typeof objs !== 'undefined') ? objs : null;
		this._outputStream.length = 0;
		if (this.objs != null) this._outputStream.push.apply(this._outputStream, objs);
		this.OutputStreamDirty();
	}
	PushEvaluationStack(obj){
//		var listValue = obj as ListValue;
		var listValue = obj;
		if (listValue instanceof ListValue) {

			// Update origin when list is has something to indicate the list origin
			var rawList = listValue.value;

			if (rawList.originNames != null) {
			if (!rawList.origins) rawList.origins = [];
			rawList.origins.length = 0;

			rawList.originNames.forEach(n => {
				var def = null;
				def = this.story.listDefinitions.TryListGetDefinition(n, def);
				if (rawList.origins.indexOf(def) < 0) rawList.origins.push(def);
			});
			}
		}

		this.evaluationStack.push(obj);
	}
	PopEvaluationStack(numberOfObjects){
		if (!numberOfObjects){
			var obj = this.evaluationStack.pop();
			return obj;
		}
		else{
			if(numberOfObjects > this.evaluationStack.length) {
				throw "trying to pop too many objects";
			}

			var popped = this.evaluationStack.splice(this.evaluationStack.length - numberOfObjects, numberOfObjects);
			return popped;
		}
	}
	PeekEvaluationStack(){
		 return this.evaluationStack[this.evaluationStack.length - 1];
	}
	PushToOutputStream(obj){
//		var text = obj as StringValue;
		var text = obj;
		if (text instanceof StringValue) {
			var listText = this.TrySplittingHeadTailWhitespace(text);
			if (listText != null) {
				listText.forEach(textObj => {
					this.PushToOutputStreamIndividual(textObj);
				});
				this.OutputStreamDirty();
				return;
			}
		}

		this.PushToOutputStreamIndividual(obj);
		this.OutputStreamDirty();
	}
	PopFromOutputStream(count){
		this.outputStream.splice(this.outputStream.length - count, count);
		this.OutputStreamDirty();
	}
	TrySplittingHeadTailWhitespace(single){
		var str = single.value;

		var headFirstNewlineIdx = -1;
		var headLastNewlineIdx = -1;
		for (var i = 0; i < str.length; ++i) {
			var c = str[i];
			if (c == '\n') {
				if (headFirstNewlineIdx == -1)
					headFirstNewlineIdx = i;
				headLastNewlineIdx = i;
			}
			else if (c == ' ' || c == '\t')
				continue;
			else
				break;
		}

		var tailLastNewlineIdx = -1;
		var tailFirstNewlineIdx = -1;
		for (var i = 0; i < str.length; ++i) {
			var c = str[i];
			if (c == '\n') {
				if (tailLastNewlineIdx == -1)
					tailLastNewlineIdx = i;
				tailFirstNewlineIdx = i;
			}
			else if (c == ' ' || c == '\t')
				continue;
			else
				break;
		}

		// No splitting to be done?
		if (headFirstNewlineIdx == -1 && tailLastNewlineIdx == -1)
			return null;

		var listTexts = [];
		var innerStrStart = 0;
		var innerStrEnd = str.length;

		if (headFirstNewlineIdx != -1) {
			if (headFirstNewlineIdx > 0) {
				var leadingSpaces = str.substring(0, headFirstNewlineIdx);
				listTexts.push(leadingSpaces);
			}
			listTexts.push(new StringValue("\n"));
			innerStrStart = headLastNewlineIdx + 1;
		}

		if (tailLastNewlineIdx != -1) {
			innerStrEnd = tailFirstNewlineIdx;
		}

		if (innerStrEnd > innerStrStart) {
			var innerStrText = str.substring(innerStrStart, innerStrEnd - innerStrStart);
			listTexts.push(new StringValue(innerStrText));
		}

		if (tailLastNewlineIdx != -1 && tailFirstNewlineIdx > headLastNewlineIdx) {
			listTexts.push(new StringValue("\n"));
			if (tailLastNewlineIdx < str.length - 1) {
				var numSpaces = (str.length - tailLastNewlineIdx) - 1;
				var trailingSpaces = new StringValue(str.substring(tailLastNewlineIdx + 1, numSpaces));
				listTexts.push(trailingSpaces);
			}
		}

		return listTexts;
	}
	PushToOutputStreamIndividual(obj){
		var glue = obj;
		var text = obj;

		var includeInOutput = true;

		if (glue instanceof Glue) {
			this.TrimNewlinesFromOutputStream();
			includeInOutput = true;
		}

		else if( text instanceof StringValue ) {

			var functionTrimIndex = -1;
			var currEl = this.callStack.currentElement;
			if (currEl.type == PushPopType.Function) {
				functionTrimIndex = currEl.functionStartInOutputStream;
			}

			var glueTrimIndex = -1;
			for (var i = this._outputStream.length - 1; i >= 0; i--) {
				var o = this._outputStream[i];
				var c = (o instanceof ControlCommand) ? o : null;
				var g = (o instanceof Glue) ? o : null;

				if (g != null) {
					glueTrimIndex = i;
					break;
				}

				else if (c != null && c.commandType == ControlCommand.CommandType.BeginString) {
					if (i >= functionTrimIndex) {
						functionTrimIndex = -1;
					}
					break;
				}
			}

			var trimIndex = -1;
			if (glueTrimIndex != -1 && functionTrimIndex != -1)
				trimIndex = Math.min(functionTrimIndex, glueTrimIndex);
			else if (glueTrimIndex != -1)
				trimIndex = glueTrimIndex;
			else
				trimIndex = functionTrimIndex;

			if (trimIndex != -1) {

				if (text.isNewline) {
					includeInOutput = false;
				}

				else if (text.isNonWhitespace) {

					if (glueTrimIndex > -1)
						this.RemoveExistingGlue();

					if (functionTrimIndex > -1) {
						var callStackElements = this.callStack.elements;
						for (var i = callStackElements.length - 1; i >= 0; i--) {
							var el = callStackElements[i];
							if (el.type == PushPopType.Function) {
								el.functionStartInOutputStream = -1;
							} else {
								break;
							}
						}
					}
				}
			}

			else if (text.isNewline) {
				if (this.outputStreamEndsInNewline || !this.outputStreamContainsContent)
					includeInOutput = false;
			}
		}

		if (includeInOutput) {
			this._outputStream.push(obj);
			this.OutputStreamDirty();
		}
	}
	TrimNewlinesFromOutputStream(rightGlueToStopAt){
		var removeWhitespaceFrom = -1;

		var i = this._outputStream.length-1;
		while (i >= 0) {
			var obj = this._outputStream[i];
			var cmd = (obj instanceof ControlCommand) ? obj : null;
			var txt = (obj instanceof StringValue) ? obj : null;

			if (cmd != null || (txt != null && txt.isNonWhitespace)) {
				break;
			} else if (txt != null && txt.isNewline) {
				removeWhitespaceFrom = i;
			}
			i--;
		}

		// Remove the whitespace
		if (removeWhitespaceFrom >= 0) {
			i=removeWhitespaceFrom;
			while(i < this._outputStream.length) {
//				var text = _outputStream [i] as StringValue;
				var text = this._outputStream[i];
				if (text instanceof StringValue) {
					this._outputStream.splice(i, 1);
				} else {
					i++;
				}
			}
		}

		this.OutputStreamDirty();
	}
	RemoveExistingGlue(){
		for (var i = this._outputStream.length - 1; i >= 0; i--) {
			var c = this._outputStream[i];
			if (c instanceof Glue) {
				this._outputStream.splice(i, 1);
			} else if( c instanceof ControlCommand ) { // e.g. BeginString
				break;
			}
		}

		this.OutputStreamDirty();
	}
	ForceEnd(){
		while (this.callStack.canPopThread)
			this.callStack.PopThread();

		while (this.callStack.canPop)
			this.PopCallStack()

		this._currentChoices.length = 0;

		this.currentPointer = Pointer.Null;
		this.previousPointer = Pointer.Null;

		this.didSafeExit = true;
	}
	TrimWhitespaceFromFunctionEnd(){
		// Debug.Assert (callStack.currentElement.type == PushPopType.Function);
		var functionStartPoint = this.callStack.currentElement.functionStartInOutputStream;

		if (functionStartPoint == -1) {
			functionStartPoint = 0;
		}

		for (var i = this._outputStream.length - 1; i >= functionStartPoint; i--) {
			var obj = this._outputStream[i];
			var txt = (obj instanceof StringValue) ? obj : null;
			var cmd = (obj instanceof ControlCommand) ? obj : null;

			if (txt == null) continue;
			if (cmd) break;

			if (txt.isNewline || txt.isInlineWhitespace) {
				this._outputStream.splice(i, 1);
				this.OutputStreamDirty();
			} else {
				break;
			}
		}
	}
	PopCallStack(popType) {
		popType = (typeof popType !== 'undefined') ? popType : null;

		if (this.callStack.currentElement.type == PushPopType.Function)
			this.TrimWhitespaceFromFunctionEnd();

		this.callStack.Pop(popType);
	}
	SetChosenPath(path){
		// Changing direction, assume we need to clear current set of choices
		this._currentChoices.length = 0;

		var newPointer = this.story.PointerAtPath(path);
		if (!newPointer.isNull && newPointer.index == -1)
			newPointer.index = 0;

		this.currentPointer = newPointer;

		this._currentTurnIndex++;
	}
	StartFunctionEvaluationFromGame(funcContainer, args){
		this.callStack.Push(PushPopType.FunctionEvaluationFromGame, this.evaluationStack.length);
		this.callStack.currentElement.currentPointer = Pointer.StartOf(funcContainer);

		this.PassArgumentsToEvaluationStack(args);
	}
	PassArgumentsToEvaluationStack(args){
		// Pass arguments onto the evaluation stack
		if (args != null) {
			for (var i = 0; i < args.length; i++) {
				if (!(typeof args[i] === 'number' || typeof args[i] === 'string')) {
					throw "ink arguments when calling EvaluateFunction / ChoosePathStringWithParameters  must be int, float or string";
				}

				this.PushEvaluationStack(Value.Create(args[i]));
			}
		}
	}
	TryExitFunctionEvaluationFromGame(){
		if (this.callStack.currentElement.type == PushPopType.FunctionEvaluationFromGame) {
			this.currentPointer = Pointer.Null;
			this.didSafeExit = true;
			return true;
		}

		return false;
	}
	CompleteFunctionEvaluationFromGame(){
		if (this.callStack.currentElement.type != PushPopType.FunctionEvaluationFromGame) {
			throw new StoryException("Expected external function evaluation to be complete. Stack trace: "+callStack.callStackTrace);
		}

		var originalEvaluationStackHeight = this.callStack.currentElement.evaluationStackHeightWhenPushed;
		// Do we have a returned value?
		// Potentially pop multiple values off the stack, in case we need
		// to clean up after ourselves (e.g. caller of EvaluateFunction may
		// have passed too many arguments, and we currently have no way to check for that)
		var returnedObj = null;
		while (this.evaluationStack.length > originalEvaluationStackHeight) {
			var poppedObj = this.PopEvaluationStack();
			if (returnedObj == null)
				returnedObj = poppedObj;
		}

		this.PopCallStack(PushPopType.FunctionEvaluationFromGame);

		if (returnedObj) {
			if (returnedObj instanceof Void)
				return null;

			// Some kind of value, if not void
//			var returnVal = returnedObj as Runtime.Value;
			var returnVal = returnedObj;

			// DivertTargets get returned as the string of components
			// (rather than a Path, which isn't public)
			if (returnVal.valueType == ValueType.DivertTarget) {
				return returnVal.valueObject.toString();
			}

			// Other types can just have their exact object type:
			// int, float, string. VariablePointers get returned as strings.
			return returnVal.valueObject;
		}

		return null;
	}
	AddError(message, isWarning){
		if (!isWarning) {
			if (this._currentErrors == null) this._currentErrors = [];
			this._currentErrors.push(message);
		} else {
			if (this._currentWarnings == null) this._currentWarnings = [];
			this._currentWarnings.push(message);
		}
	}
	OutputStreamDirty(){
		this._outputStreamTextDirty = true;
		this._outputStreamTagsDirty = true;
	}
	VisitCountAtPathString(pathString){
		var visitCountOut;
		if (visitCountOut = this.visitCounts[pathString])
			return visitCountOut;

		return 0;
	}
	Copy(){
		var copy = new StoryState(this.story);

		copy.outputStream.push.apply(copy.outputStream, this._outputStream);
		this.OutputStreamDirty();

		copy._currentChoices.push.apply(copy._currentChoices, this._currentChoices);

		if (this.hasError) {
			copy._currentErrors = [];
			copy._currentErrors.push.apply(copy._currentErrors, this.currentErrors);
		}

		if (this.hasWarning) {
			copy._currentWarnings = [];
			copy._currentWarnings.push.apply(copy._currentWarnings, this.currentWarnings);
		}

		copy.callStack = new CallStack(this.callStack);

		copy._variablesState = new VariablesState(copy.callStack, this.story.listDefinitions);
		copy.variablesState.CopyFrom(this.variablesState);

		copy.evaluationStack.push.apply(copy.evaluationStack, this.evaluationStack);

		if (!this.divertedPointer.isNull)
			copy.divertedPointer = this.divertedPointer.copy();

		copy.previousPointer = this.previousPointer.copy();

		copy._visitCounts = {};
		for (var keyValue in this._visitCounts) {
		      	copy._visitCounts[keyValue] = this._visitCounts[keyValue];
		}
		copy._turnIndices = {};
		for (var keyValue in this._turnIndices) {
			copy._turnIndices[keyValue] = this._turnIndices[keyValue];
		}

		copy._currentTurnIndex = this.currentTurnIndex;
		copy.storySeed = this.storySeed;
		copy.previousRandom = this.previousRandom;

		copy.didSafeExit = this.didSafeExit;

		return copy;
	}

	ToJson(indented){
		return JSON.stringify(this.jsonToken, null, (indented) ? 2 : 0);
	}
	LoadJson(jsonString){
		this.jsonToken = JSON.parse(jsonString);
	}
}

StoryState.kInkSaveStateVersion = 8;
StoryState.kMinCompatibleLoadVersion = 8;
