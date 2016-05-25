export class StoryState{
	constructor(story){
		this._outputStream;
		this._currentChoices;
		this._currentErrors;
		this._variablesState;
		this._callStack;
		this._evaluationStack;
		this._divertedTargetObject;
		this._visitCounts;
		this._turnIndices;
		this._turnIndices;
		this._currentTurnIndex;
		this._storySeed;
		this._didSafeExit;
		
		this._story;
		this._currentPath;	
		this._currentContentObject;
		this._currentContainer;
		this._hasError;
		
		this._inExpressionEvaluation;
		
		//actual constructor
		this._story = story;
		
		_outputStream = new List<Runtime.Object> ();

		this._evaluationStack = [];

		this._callStack = new CallStack(story.rootContentContainer);
		this._variablesState = new VariablesState(callStack);

		this._visitCounts = {};
		this._turnIndices = {};
		this._currentTurnIndex = -1;

		//there's no pseudo random generator in js, so try to generate somthing that's unique enough
		var timeSeed = (new Date()).getTime();
		this._storySeed = timeSeed + '-' + Math.round(Math.random() * 9999);

		this._currentChoices = [];

		this.GoToStart();
	}
	hasError(){
		return this._currentErrors != null && this._currentErrors.length > 0;
	}
	GoToStart(){
		this._callStackcallStack.currentElement.currentContainer = story.mainContentContainer;
		this._callStackcallStack.currentElement.currentContentIndex = 0;
	}
}

StoryState.kInkSaveStateVersion = 2;
StoryState.kMinCompatibleLoadVersion = 2;