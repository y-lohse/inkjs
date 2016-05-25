import {JsonSerialisation} from './JsonSerialisation';

export class Story{
	constructor(jsonString){
		this.inkVersionCurrent = 11;
		this.inkVersionMinimumCompatible = 11;
		this.allowExternalFunctionFallbacks = false;
		
		this._mainContentContainer;
		this._externals;
		this._variableObservers;
		this._hasValidatedExternals;
		this._temporaryEvaluationContainer;
		this._state;
		
		//@TODO : implement the internal constructor
		//internal Story (Container contentContainer)
		
		var rootObject = JSON.parse(jsonString);
		
		var versionObj = rootObject["inkVersion"];
		if (versionObj == null)
			throw "ink version number not found. Are you sure it's a valid .ink.json file?";
		
		var formatFromFile = parseInt(versionObj);
		if (formatFromFile > this.inkVersionCurrent){
			throw "Version of ink used to build story was newer than the current verison of the engine";
		}
		else if (formatFromFile < this.inkVersionMinimumCompatible){
			throw "Version of ink used to build story is too old to be loaded by this verison of the engine";
		}
		else if (formatFromFile != this.inkVersionCurrent){
			console.log("WARNING: Version of ink used to build story doesn't match current version of engine. Non-critical, but recommend synchronising.");
		}
		
		var rootToken = rootObject["root"];
		if (rootToken == null)
			throw "Root node for ink not found. Are you sure it's a valid .ink.json file?";
		
		this._mainContentContainer = JsonSerialisation.JTokenToRuntimeObject(rootToken);
//		_mainContentContainer = Json.JTokenToRuntimeObject (rootToken) as Container;

//		ResetState ();
	}
//	currentChoices(){
//		
//	}
//	currentText(){
//		
//	}
//	currentErrors(){
//		
//	}
//	hasError(){
//		
//	}
//	variablesState(){
//		
//	}
//	state(){
//		
//	}
//	ToJsonString(){
//		
//	}
//	ResetState(){
//		
//	}
//	ResetErrors(){
//		
//	}
//	ResetCallstack(){
//		
//	}
//	ResetGlobals(){
//		
//	}
//	Continue(){
//		
//	}
//	ContinueInternal(){
//		
//	}
//	canContinue(){
//		
//	}
//	ContinueMaximally(){
//		
//	}
//	ContentAtPath(){
//		
//	}
//	StateSnapshot(){
//		
//	}
//	RestoreStateSnapshot(){
//		
//	}
//	Step(){
//		
//	}
//	VisitContainer(){
//		
//	}
//	VisitChangedContainersDueToDivert(){
//		
//	}
//	ProcessChoice(){
//		
//	}
//	IsTruthy(){
//		
//	}
//	PerformLogicAndFlowControl(){
//		
//	}
//	ChoosePathString(){
//		
//	}
//	ChoosePath(){
//		
//	}
//	ChooseChoiceIndex(){
//		
//	}
//	EvaluateExpression(){
//		
//	}
//	CallExternalFunction(){
//		
//	}
//	ExternalFunction(){
//		//delegate
//	}
//	BindExternalFunctionGeneral(){
//		
//	}
//	TryCoerce(){
//		
//	}
//	BindExternalFunction(){
//		//polymorph
//	}
//	UnbindExternalFunction(){
//		
//	}
//	ValidateExternalBindings(){
//		
//	}
//	ValidateExternalBindings(){
//		//polymorph
//	}
//	VariableObserver(){
//		//delegate
//	}
//	ObserveVariable(){
//		
//	}
//	ObserveVariables(){
//		
//	}
//	RemoveVariableObserver(){
//		
//	}
//	VariableStateDidChangeEvent(){
//		
//	}
//	BuildStringOfHierarchy(){
//		//virtual
//	}
//	NextContent(){
//		
//	}
//	IncrementContentPointer(){
//		
//	}
//	TryFollowDefaultInvisibleChoice(){
//		
//	}
//	VisitCountForContainer(){
//		
//	}
//	IncrementVisitCountForContainer(){
//		
//	}
//	RecordTurnIndexVisitToContainer(){
//		
//	}
//	TurnsSinceForContainer(){
//		
//	}
//	NextSequenceShuffleIndex(){
//		
//	}
//	Error(){
//		
//	}
//	AddError(){
//		
//	}
//	Assert(){
//		
//	}
//	currentDebugMetadata(){
//		
//	}
//	currentLineNumber(){
//		
//	}
//	mainContentContainer(){
//		
//	}
}