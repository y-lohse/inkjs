import {CallStack} from './CallStack';
import {VariablesState} from './VariablesState';
import {StringValue} from './Value';
import {Glue} from './Glue';
import {ControlCommand} from './ControlCommand';

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
		
		this.currentErrors = [];
		this.divertedTargetObject = null;

		//there's no pseudo random generator in js, so try to generate somthing that's unique enough
		var timeSeed = (new Date()).getTime();
		this._storySeed = timeSeed + '-' + Math.round(Math.random() * 9999);

		this._currentChoices = [];

		this.GoToStart();
	}
	get currentChoices(){
		return this._currentChoices;
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
	
	GoToStart(){
		this.callStack.currentElement.currentContainer = this.story.mainContentContainer;
        this.callStack.currentElement.currentContentIndex = 0;
	}
	ResetOutput(){
		this._outputStream.length = 0;
	}
	PushEvaluationStack(obj){
		this.evaluationStack.push(obj);
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
}

StoryState.kInkSaveStateVersion = 2;
StoryState.kMinCompatibleLoadVersion = 2;