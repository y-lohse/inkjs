//complete but misses some Glue related code
import {CallStack} from './CallStack';
import {VariablesState} from './VariablesState';
import {StringValue} from './Value';
import {Glue} from './Glue';
import {ControlCommand} from './ControlCommand';
import {JsonSerialisation as Json} from './JsonSerialisation';
import {Story} from './Story';

export class StoryState{
	constructor(story){		
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
		var timeSeed = (new Date()).getTime();
		this._storySeed = timeSeed + '-' + Math.round(Math.random() * 9999);

		this._currentChoices = [];
		this._currentErrors = null;
		
		this._currentRightGlue;
		
		this.didSafeExit = false;

		this.GoToStart();
	}
	get currentChoices(){
		return this._currentChoices;
	}
	get currentErrors(){
		return this._currentErrors;
	}
	get callStack(){
		return this._callStack;
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
	get storySeed(){
		return this._storySeed;
	}
	get currentContentObject(){
		return this.callStack.currentElement.currentObject;
	}
	set currentContentObject(value){
		this.callStack.currentElement.currentObject = value;
	}
	get hasError(){
		return this.currentErrors != null && this.currentErrors.length > 0;
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
	get currentGlueIndex(){
		for (var i = this._outputStream.length - 1; i >= 0; i--) {
			var c = this._outputStream[i];
//			var glue = c as Glue;
			var glue = c;
			if (glue instanceof Glue)
				return i;
			else if (c instanceof ControlCommand) // e.g. BeginString
				break;
		}
		return -1;
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
		var sb = '';
		
		this._outputStream.forEach(outputObj => {
//			var textContent = outputObj as StringValue;
			var textContent = outputObj;
			if (textContent instanceof StringValue) {
				sb += textContent.value;
			}
		});

		return sb;
	}
	get outputStream(){
		return this._outputStream;
	}
	get currentPath(){
		if (this.currentContentObject == null)
			return null;

		return this.currentContentObject.path;
	}
	set currentPath(value){
		if (value != null)
			this.currentContentObject = this.story.ContentAtPath(value);
		else
			this.currentContentObject = null;
	}
	get currentContainer(){
		return this.callStack.currentElement.currentContainer;
	}
	get jsonToken(){
		var obj = {};

		var choiceThreads = null;
		this.currentChoices.forEach(c => {
			c.originalChoicePath = c.choicePoint.path.componentsString;
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

		obj["evalStack"] = Json.ListToJArray(this.evaluationStack);

		obj["outputStream"] = Json.ListToJArray(this._outputStream);

		obj["currentChoices"] = Json.ListToJArray(this.currentChoices);

		if (this._currentRightGlue) {
			var rightGluePos = this._outputStream.indexOf(this._currentRightGlue);
			if( rightGluePos != -1 ) {
				obj["currRightGlue"] = this._outputStream.indexOf(this._currentRightGlue);
			}
		}

		if( this.divertedTargetObject != null )
			obj["currentDivertTarget"] = this.divertedTargetObject.path.componentsString;

		obj["visitCounts"] = Json.IntDictionaryToJObject(visitCounts);
		obj["turnIndices"] = Json.IntDictionaryToJObject(turnIndices);
		obj["turnIdx"] = this.currentTurnIndex;
		obj["storySeed"] = this.storySeed;

		obj["inkSaveVersion"] = kInkSaveStateVersion;

		// Not using this right now, but could do in future.
		obj["inkFormatVersion"] = Story.inkVersionCurrent;

		return obj;
	}
	set jsonToken(value){
		var jObject = value;

		var jSaveVersion = jObject["inkSaveVersion"];
		if (jSaveVersion == null) {
			throw "ink save format incorrect, can't load.";
		}
		else if (parseInt(jSaveVersion) < StoryState.kMinCompatibleLoadVersion) {
			throw "Ink save format isn't compatible with the current version (saw '"+jSaveVersion+"', but minimum is "+StoryState.kMinCompatibleLoadVersion+"), so can't load.";
		}

		this.callStack.SetJsonToken(jObject["callstackThreads"], this.story);
		this.variablesState.jsonToken = jObject["variablesState"];

		this.evaluationStack = Json.JArrayToRuntimeObjList(jObject["evalStack"]);

		this._outputStream = Json.JArrayToRuntimeObjList(jObject["outputStream"]);

//		currentChoices = Json.JArrayToRuntimeObjList<Choice>((JArray)jObject ["currentChoices"]);
		this.currentChoices = Json.JArrayToRuntimeObjList(jObject["currentChoices"]);

		var propValue;
		if( propValue = jObject["currRightGlue"] ) {
			var gluePos = parseInt(propValue);
			if( gluePos >= 0 ) {
//				_currentRightGlue = _outputStream [gluePos] as Glue;
				this._currentRightGlue = this._outputStream[gluePos];
			}
		}

		var currentDivertTargetPath = jObject["currentDivertTarget"];
		if (currentDivertTargetPath != null) {
			var divertPath = new Path(currentDivertTargetPath.toString());
			this.divertedTargetObject = this.story.ContentAtPath(divertPath);
		}

		this.visitCounts = Json.JObjectToIntDictionary(jObject["visitCounts"]);
		this.turnIndices = Json.JObjectToIntDictionary(jObject["turnIndices"]);
		this.currentTurnIndex = parseInt(jObject["turnIdx"]);
		this.storySeed = parseInt(jObject["storySeed"]);

//		var jChoiceThreads = jObject["choiceThreads"] as JObject;
		var jChoiceThreads = jObject["choiceThreads"];
		
		this.currentChoices.forEach(c => {
			c.choicePoint = this.story.ContentAtPath(new Path(c.originalChoicePath));

			var foundActiveThread = this.callStack.ThreadWithIndex(c.originalThreadIndex);
			if( foundActiveThread != null ) {
				c.threadAtGeneration = foundActiveThread;
			} else {
				var jSavedChoiceThread = jChoiceThreads[c.originalThreadIndex.toString()];
				c.threadAtGeneration = new CallStack.Thread(jSavedChoiceThread, this.story);
			}
		});
	}
	
	GoToStart(){
		this.callStack.currentElement.currentContainer = this.story.mainContentContainer;
        this.callStack.currentElement.currentContentIndex = 0;
	}
	ResetErrors(){
		this.currentErrors = null;
	}
	ResetOutput(){
		this._outputStream.length = 0;
	}
	PushEvaluationStack(obj){
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

            var popped = evaluationStack.splice(evaluationStack.length - numberOfObjects, numberOfObjects);
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
				return;
			}
		}

		this.PushToOutputStreamIndividual(obj);
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
				var numSpaces = (str.Length - tailLastNewlineIdx) - 1;
				var trailingSpaces = new StringValue(str.substring(tailLastNewlineIdx + 1, numSpaces));
				listTexts.push(trailingSpaces);
			}
		}

		return listTexts;
	}
	PushToOutputStreamIndividual(obj){
		var glue = obj instanceof Glue;
		var text = obj instanceof StringValue;

		var includeInOutput = true;

		if (glue) {
			throw "Glue not implemented";
//			// Found matching left-glue for right-glue? Close it.
//			bool foundMatchingLeftGlue = glue.isLeft && _currentRightGlue && glue.parent == _currentRightGlue.parent;
//			if (foundMatchingLeftGlue) {
//				_currentRightGlue = null;
//			}
//
//			// Left/Right glue is auto-generated for inline expressions 
//			// where we want to absorb newlines but only in a certain direction.
//			// "Bi" glue is written by the user in their ink with <>
//			if (glue.isLeft || glue.isBi) {
//				TrimNewlinesFromOutputStream(stopAndRemoveRightGlue:foundMatchingLeftGlue);
//			}
//
//			// New right-glue
//			bool isNewRightGlue = glue.isRight && _currentRightGlue == null;
//			if (isNewRightGlue) {
//				_currentRightGlue = glue;
//			}
//
//			includeInOutput = glue.isBi || isNewRightGlue;
		}

		else if( text ) {

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
				if (this.outputStreamEndsInNewline || !this.outputStreamContainsContent)
					includeInOutput = false;
			}
		}

		if (includeInOutput) {
			this._outputStream.push(obj);
		}
	}
	TrimNewlinesFromOutputStream(stopAndRemoveRightGlue){
		var removeWhitespaceFrom = -1;
		var rightGluePos = -1;
		var foundNonWhitespace = false;

		// Work back from the end, and try to find the point where
		// we need to start removing content. There are two ways:
		//  - Start from the matching right-glue (because we just saw a left-glue)
		//  - Simply work backwards to find the first newline in a string of whitespace
		var i = this._outputStream.length-1;
		while (i >= 0) {
			var obj = this._outputStream[i];
//			var cmd = obj as ControlCommand;
			var cmd = obj;
//			var txt = obj as StringValue;
			var txt = obj;
//			var glue = obj as Glue;
			var glue = obj;

			if (cmd instanceof ControlCommand || (txt instanceof StringValue && txt.isNonWhitespace)) {
				foundNonWhitespace = true;
				if( !stopAndRemoveRightGlue )
					break;
			} else if (stopAndRemoveRightGlue && glue instanceof Glue && glue.isRight) {
				rightGluePos = i;
				break;
			} else if (txt instanceof StringValue && txt.isNewline && !foundNonWhitespace) {
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

		// Remove the glue (it will come before the whitespace,
		// so index is still valid)
		if (stopAndRemoveRightGlue && rightGluePos > -1)
			this._outputStream.splice(rightGluePos, 1);
	}
	TrimFromExistingGlue(){
		var i = this.currentGlueIndex;
		while (i < this._outputStream.length) {
//			var txt = _outputStream [i] as StringValue;
			var txt = this._outputStream[i];
			if (txt instanceof StringValue && !txt.isNonWhitespace)
				this._outputStream.splice(i, 1);
			else
				i++;
		}
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
	}
	ForceEndFlow(){
		this.currentContentObject = null;

		while (this.callStack.canPopThread)
			this.callStack.PopThread();

		while (this.callStack.canPop)
			callStack.Pop();

		this.currentChoices.length = 0;

		this.didSafeExit = true;
	}
	SetChosenPath(path){
		// Changing direction, assume we need to clear current set of choices
		this.currentChoices.length = 0;

		this.currentPath = path;

		this._currentTurnIndex++;
	}
	AddError(message){
		if (this.currentErrors == null) {
			this.currentErrors = [];
		}

		currentErrors.push(message);
	}
	VisitCountAtPathString(pathString){
		var visitCountOut;
		if (visitCountOut = this.visitCounts[pathString])
			return visitCountOut;

		return -1;
	}
	Copy(){
		var copy = new StoryState(this.story);

		copy.outputStream = copy.outputStream.concat(this._outputStream);
		copy.currentChoices = copy.currentChoices.concat(this.currentChoices);

		if (this.hasError) {
			copy.currentErrors = [];
			copy.currentErrors = copy.currentErrors.concat(this.currentErrors);
		}

		copy.callStack = new CallStack(this.callStack);

		copy._currentRightGlue = this._currentRightGlue;

		copy.variablesState = new VariablesState(copy.callStack);
		copy.variablesState.CopyFrom(this.variablesState);

		copy.evaluationStack = copy.evaluationStack.concat(this.evaluationStack);

		if (this.divertedTargetObject != null)
			copy.divertedTargetObject = this.divertedTargetObject;

		copy.visitCounts = {};
		copy.turnIndices = {};
		copy.currentTurnIndex = this.currentTurnIndex;
		copy.storySeed = this.storySeed;

		copy.didSafeExit = this.didSafeExit;

		return copy;
	}
	
	toJson(indented){
		throw "figur eout formating option";
		return this.jsonToken.toString(indented ? Formatting.Indented : Formatting.None);
	}
	LoadJson(jsonString){
		this.jsonToken = JSON.parse(json);
	}
}

StoryState.kInkSaveStateVersion = 2;
StoryState.kMinCompatibleLoadVersion = 2;