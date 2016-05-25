import {CallStack} from './CallStack';
import {VariablesState} from './VariablesState';

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
	get storySeed(){
		return this._storySeed;
	}
	
	GoToStart(){
		this.callStack.currentElement.currentContainer = this.story.mainContentContainer;
        this.callStack.currentElement.currentContentIndex = 0;
	}
}

StoryState.kInkSaveStateVersion = 2;
StoryState.kMinCompatibleLoadVersion = 2;