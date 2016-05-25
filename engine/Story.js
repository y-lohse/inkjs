export class Story{
	constructor(){
		this.inkVersionCurrent = 11;
		this.inkVersionMinimumCompatible = 11;
		this.allowExternalFunctionFallbacks = false;
		
		this._mainContentContainer;
		this._externals;
		this._variableObservers;
		this._hasValidatedExternals;
		this._temporaryEvaluationContainer;
		this._state;
	}
	currentChoices(){
		
	}
	currentText(){
		
	}
	currentErrors(){
		
	}
	hasError(){
		
	}
	variablesState(){
		
	}
	state(){
		
	}
	ToJsonString(){
		
	}
	ResetState(){
		
	}
	ResetErrors(){
		
	}
	ResetCallstack(){
		
	}
	ResetGlobals(){
		
	}
	Continue(){
		
	}
	ContinueInternal(){
		
	}
	canContinue(){
		
	}
	ContinueMaximally(){
		
	}
	ContentAtPath(){
		
	}
	StateSnapshot(){
		
	}
	RestoreStateSnapshot(){
		
	}
	Step(){
		
	}
	VisitContainer(){
		
	}
	VisitChangedContainersDueToDivert(){
		
	}
	ProcessChoice(){
		
	}
	IsTruthy(){
		
	}
	PerformLogicAndFlowControl(){
		
	}
	ChoosePathString(){
		
	}
	ChoosePath(){
		
	}
	ChooseChoiceIndex(){
		
	}
	EvaluateExpression(){
		
	}
	CallExternalFunction(){
		
	}
	ExternalFunction(){
		//delegate
	}
	BindExternalFunctionGeneral(){
		
	}
	TryCoerce(){
		
	}
	BindExternalFunction(){
		//polymorph
	}
	UnbindExternalFunction(){
		
	}
	ValidateExternalBindings(){
		
	}
	ValidateExternalBindings(){
		//polymorph
	}
	VariableObserver(){
		//delegate
	}
	ObserveVariable(){
		
	}
	ObserveVariables(){
		
	}
	RemoveVariableObserver(){
		
	}
	VariableStateDidChangeEvent(){
		
	}
	BuildStringOfHierarchy(){
		//virtual
	}
	NextContent(){
		
	}
	IncrementContentPointer(){
		
	}
	TryFollowDefaultInvisibleChoice(){
		
	}
	VisitCountForContainer(){
		
	}
	IncrementVisitCountForContainer(){
		
	}
	RecordTurnIndexVisitToContainer(){
		
	}
	TurnsSinceForContainer(){
		
	}
	NextSequenceShuffleIndex(){
		
	}
	Error(){
		
	}
	AddError(){
		
	}
	Assert(){
		
	}
	currentDebugMetadata(){
		
	}
	currentLineNumber(){
		
	}
	mainContentContainer(){
		
	}
	
}