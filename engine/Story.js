import {Object as InkObject} from './Object';
import {JsonSerialisation} from './JsonSerialisation';
import {StoryState} from './StoryState';

export class Story extends InkObject{
	constructor(jsonString){
		super();
		
		this.inkVersionCurrent = 11;
		this.inkVersionMinimumCompatible = 11;

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

		this.ResetState();
	}
	
	get mainContentContainer(){
		if (this._temporaryEvaluationContainer) {
			return this._temporaryEvaluationContainer;
		} else {
			return this._mainContentContainer;
		}
	}
	get state(){
		return this._state;
	}
	get canContinue(){
		return this.state.currentContentObject != null && !this.state.hasError;
	}
	
	ResetState(){
		this._state = new StoryState(this);
//		this._state.variablesState.variableChangedEvent += VariableStateDidChangeEvent;//@TODO: figure out what this does
		
		this.ResetGlobals();
	}
	ResetGlobals(){
		if (this._mainContentContainer.namedContent["global decl"]){
			throw "Story.ResetGlobals not implemented";
			var originalPath = this.state.currentPath;

			this.ChoosePathString("global decl");

			// Continue, but without validating external bindings,
			// since we may be doing this reset at initialisation time.
			this.ContinueInternal();

			this.state.currentPath = this.originalPath;
		}
	}
}