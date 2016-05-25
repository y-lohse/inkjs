import {JsonSerialisation} from './JsonSerialisation';

export class Story{
	constructor(jsonString){
		this.inkVersionCurrent = 11;
		this.inkVersionMinimumCompatible = 11;
		
		this._mainContentContainer;

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

//		this.ResetState();
	}
	ResetState(){
//		_state = new StoryState(this);
//		_state.variablesState.variableChangedEvent += VariableStateDidChangeEvent;
		
//		this.ResetGlobals();
	}
}