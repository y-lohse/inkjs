import {Container} from './Container';
import {Object as InkObject} from './Object';
import {JsonSerialisation} from './JsonSerialisation';
import {StoryState} from './StoryState';
import {ControlCommand} from './ControlCommand';
import {PushPopType} from './PushPop';
import {ChoicePoint} from './ChoicePoint';
import {Choice} from './Choice';
import {Divert} from './Divert';
import {Value, StringValue, IntValue, DivertTargetValue, VariablePointerValue, ListValue} from './Value';
import {Path} from './Path';
import {Void} from './Void';
import {Tag} from './Tag';
import {VariableAssignment} from './VariableAssignment';
import {VariableReference} from './VariableReference';
import {NativeFunctionCall} from './NativeFunctionCall';
import {StoryException} from './StoryException';
import {PRNG} from './PRNG';
import {StringBuilder} from './StringBuilder';
import {ListDefinitionsOrigin} from './ListDefinitionsOrigin';

if (!Number.isInteger) {
	Number.isInteger = function isInteger (nVal) {
		return typeof nVal === "number" && isFinite(nVal) && nVal > -9007199254740992 && nVal < 9007199254740992 && Math.floor(nVal) === nVal;
	};
}

export class Story extends InkObject{
	constructor(jsonString, lists){
		super();
		
		lists = lists || null;
		
		this.inkVersionCurrent = 17;
		this.inkVersionMinimumCompatible = 16;
		
		this._variableObservers = null;
		this._externals = {};
		this._prevContainerSet = null;
		this._listDefinitions = null;
		
		if (jsonString instanceof Container){
			this._mainContentContainer = jsonString;
			
			if (lists != null)
				this._listDefinitions = new ListDefinitionsOrigin(lists);
		}
		else{
			//the original version only accepts a string as a constructor, but this is javascript and it's almost easier to get a JSON value than a string, so we're silently accepting both
			var rootObject = (typeof jsonString === 'string') ? JSON.parse(jsonString) : jsonString;

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
				console.warn("WARNING: Version of ink used to build story doesn't match current version of engine. Non-critical, but recommend synchronising.");
			}

			var rootToken = rootObject["root"];
			if (rootToken == null)
				throw "Root node for ink not found. Are you sure it's a valid .ink.json file?";
			
			var listDefsObj;
            if (listDefsObj = rootObject["listDefs"]) {
                this._listDefinitions = JsonSerialisation.JTokenToListDefinitions(listDefsObj);
            }

			this._mainContentContainer = JsonSerialisation.JTokenToRuntimeObject(rootToken);

			this._hasValidatedExternals = null;
			this.allowExternalFunctionFallbacks = false;

			this.ResetState();
		}
	}
	
	get currentChoices(){
		// Don't include invisible choices for external usage.
		var choices = [];
		
		this._state.currentChoices.forEach(c => {
			if (!c.choicePoint.isInvisibleDefault) {
				c.index = choices.length;
				choices.push(c);
			}
		});
		
		return choices;
	}
	get currentText(){
		return this.state.currentText;
	}
	get currentTags(){
		return this.state.currentTags;
	}
	get currentErrors(){
		return this.state.currentErrors;
	}
	get hasError(){
		return this.state.hasError;
	}
	get variablesState(){
		return this.state.variablesState;
	}
	get listDefinitions (){
		return this._listDefinitions;
	}
	get state(){
		return this._state;
	}
	
	get mainContentContainer(){
		if (this._temporaryEvaluationContainer) {
			return this._temporaryEvaluationContainer;
		} else {
			return this._mainContentContainer;
		}
	}
	get canContinue(){
		return this.state.canContinue;
	}
	
	get globalTags(){
		return this.TagsAtStartOfFlowContainerWithPathString("");
	}
	
	ToJsonString(){
		var rootContainerJsonList = JsonSerialisation.RuntimeObjectToJToken(this._mainContentContainer);

		var rootObject = {};
		rootObject["inkVersion"] = this.inkVersionCurrent;
		rootObject["root"] = rootContainerJsonList;
		
		if (this._listDefinitions != null)
			rootObject["listDefs"] = JsonSerialisation.ListDefinitionsToJToken(this._listDefinitions);

		return JSON.stringify(rootObject);
	}
	ResetState(){
		this._state = new StoryState(this);
		this._state.variablesState.ObserveVariableChange(this.VariableStateDidChangeEvent.bind(this));
		
		this.ResetGlobals();
	}
	ResetErrors(){
		this._state.ResetErrors();
	}
	ResetCallstack(){
		this._state.ForceEnd();
	}
	ResetGlobals(){
		if (this._mainContentContainer.namedContent["global decl"]){
			var originalPath = this.state.currentPath;

			this.ChoosePathString("global decl");

			// Continue, but without validating external bindings,
			// since we may be doing this reset at initialisation time.
			this.ContinueInternal();

			this.state.currentPath = originalPath;
		}
	}
	Continue(){
		if (!this._hasValidatedExternals)
			this.ValidateExternalBindings();

		return this.ContinueInternal();
	}
	ContinueInternal(){
		if (!this.canContinue) {
			throw new StoryException("Can't continue - should check canContinue before calling Continue");
		}

		this._state.ResetOutput();

		this._state.didSafeExit = false;

		this._state.variablesState.batchObservingVariableChanges = true;

		try {

			var stateAtLastNewline = null;

			// The basic algorithm here is:
			//
			//     do { Step() } while( canContinue && !outputStreamEndsInNewline );
			//
			// But the complexity comes from:
			//  - Stepping beyond the newline in case it'll be absorbed by glue later
			//  - Ensuring that non-text content beyond newlines are generated - i.e. choices,
			//    which are actually built out of text content.
			// So we have to take a snapshot of the state, continue prospectively,
			// and rewind if necessary.
			// This code is slightly fragile :-/ 
			//

			do {

				// Run main step function (walks through content)
				this.Step();

				// Run out of content and we have a default invisible choice that we can follow?
				if( !this.canContinue ) {
					this.TryFollowDefaultInvisibleChoice();
				}

				// Don't save/rewind during string evaluation, which is e.g. used for choices
				if( !this.state.inStringEvaluation ) {

					// We previously found a newline, but were we just double checking that
					// it wouldn't immediately be removed by glue?
					if( stateAtLastNewline != null ) {

						// Cover cases that non-text generated content was evaluated last step
						var currText = this.currentText;
						var prevTextLength = stateAtLastNewline.currentText.length;
						var prevTagCount = stateAtLastNewline.currentTags.length;

						// Output has been extended?
						if( currText !== stateAtLastNewline.currentText || prevTagCount != this.currentTags.length ) {

							// Original newline still exists?
							if( currText.length >= prevTextLength && currText[prevTextLength-1] == '\n' ) {

								this.RestoreStateSnapshot(stateAtLastNewline);
								break;
							}

							// Newline that previously existed is no longer valid - e.g.
							// glue was encounted that caused it to be removed.
							else {
								stateAtLastNewline = null;
							}
						}

					}

					// Current content ends in a newline - approaching end of our evaluation
					if( this.state.outputStreamEndsInNewline ) {

						// If we can continue evaluation for a bit:
						// Create a snapshot in case we need to rewind.
						// We're going to continue stepping in case we see glue or some
						// non-text content such as choices.
						if( this.canContinue ) {
								// Don't bother to record the state beyond the current newline.
								// e.g.:
								// Hello world\n			// record state at the end of here
								// ~ complexCalculation()   // don't actually need this unless it generates text
								if( stateAtLastNewline == null ) {
                                	stateAtLastNewline = this.StateSnapshot();
								}	
						} 

						// Can't continue, so we're about to exit - make sure we
						// don't have an old state hanging around.
						else {
							stateAtLastNewline = null;
						}

					}

				}

			} while(this.canContinue);

			// Need to rewind, due to evaluating further than we should?
			if( stateAtLastNewline != null ) {
				this.RestoreStateSnapshot(stateAtLastNewline);
			}

			// Finished a section of content / reached a choice point?
			if( !this.canContinue ) {

				if( this.state.callStack.canPopThread ) {
					this.Error("Thread available to pop, threads should always be flat by the end of evaluation?");
				}

				if( this.state.generatedChoices.length == 0 && !this.state.didSafeExit && this._temporaryEvaluationContainer == null) {
					if( this.state.callStack.CanPop(PushPopType.Tunnel) ) {
						this.Error("unexpectedly reached end of content. Do you need a '->->' to return from a tunnel?");
					} else if( this.state.callStack.CanPop(PushPopType.Function) ) {
						this.Error("unexpectedly reached end of content. Do you need a '~ return'?");
					} else if( !this.state.callStack.canPop ) {
						this.Error("ran out of content. Do you need a '-> DONE' or '-> END'?");
					} else {
						this.Error("unexpectedly reached end of content for unknown reason. Please debug compiler!");
					}
				}

			}


		} catch(e) {
			throw e;
			this.AddError(e.Message, e.useEndLineNumber);
		} finally {
			this.state.didSafeExit = false;
			
			this._state.variablesState.batchObservingVariableChanges = false;
		}

		return this.currentText;
	}
	ContinueMaximally(){
		var sb = new StringBuilder();

		while (this.canContinue) {
			sb.Append(this.Continue());
		}

		return sb.toString();
	}
	ContentAtPath(path){
		return this.mainContentContainer.ContentAtPath(path);
	}
	StateSnapshot(){
		return this.state.Copy();
	}
	RestoreStateSnapshot(state){
		this._state = state;
	}
	Step(){
		var shouldAddToStream = true;

		// Get current content
		var currentContentObj = this.state.currentContentObject;
		if (currentContentObj == null) {
			return;
		}
		// Step directly to the first element of content in a container (if necessary)
//		Container currentContainer = currentContentObj as Container;
		var currentContainer = currentContentObj;
		while(currentContainer instanceof Container) {

			// Mark container as being entered
			this.VisitContainer(currentContainer, true);

			// No content? the most we can do is step past it
			if (currentContainer.content.length == 0)
				break;

			currentContentObj = currentContainer.content[0];
			this.state.callStack.currentElement.currentContentIndex = 0;
			this.state.callStack.currentElement.currentContainer = currentContainer;

//			currentContainer = currentContentObj as Container;
			currentContainer = currentContentObj;
		}
		currentContainer = this.state.callStack.currentElement.currentContainer;

		// Is the current content object:
		//  - Normal content
		//  - Or a logic/flow statement - if so, do it
		// Stop flow if we hit a stack pop when we're unable to pop (e.g. return/done statement in knot
		// that was diverted to rather than called as a function)
		var isLogicOrFlowControl = this.PerformLogicAndFlowControl(currentContentObj);

		// Has flow been forced to end by flow control above?
		if (this.state.currentContentObject == null) {
			return;
		}

		if (isLogicOrFlowControl) {
			shouldAddToStream = false;
		}

		// Choice with condition?
//		var choicePoint = currentContentObj as ChoicePoint;
		var choicePoint = currentContentObj;
		if (choicePoint instanceof ChoicePoint) {
			var choice = this.ProcessChoice(choicePoint);
			if (choice) {
				this.state.generatedChoices.push(choice);
			}

			currentContentObj = null;
			shouldAddToStream = false;
		}

		// If the container has no content, then it will be
		// the "content" itself, but we skip over it.
		if (currentContentObj instanceof Container) {
			shouldAddToStream = false;
		}

		// Content to add to evaluation stack or the output stream
		if (shouldAddToStream) {

			// If we're pushing a variable pointer onto the evaluation stack, ensure that it's specific
			// to our current (possibly temporary) context index. And make a copy of the pointer
			// so that we're not editing the original runtime object.
//			var varPointer = currentContentObj as VariablePointerValue;
			var varPointer = currentContentObj;
			if (varPointer instanceof VariablePointerValue && varPointer.contextIndex == -1) {

				// Create new object so we're not overwriting the story's own data
				var contextIdx = this.state.callStack.ContextForVariableNamed(varPointer.variableName);
				currentContentObj = new VariablePointerValue(varPointer.variableName, contextIdx);
			}

			// Expression evaluation content
			if (this.state.inExpressionEvaluation) {
				this.state.PushEvaluationStack(currentContentObj);
			}
			// Output stream content (i.e. not expression evaluation)
			else {
				this.state.PushToOutputStream(currentContentObj);
			}
		}

		// Increment the content pointer, following diverts if necessary
		this.NextContent();

		// Starting a thread should be done after the increment to the content pointer,
		// so that when returning from the thread, it returns to the content after this instruction.
//		var controlCmd = currentContentObj as ControlCommand;
		var controlCmd = currentContentObj;
		if (controlCmd instanceof ControlCommand && controlCmd.commandType == ControlCommand.CommandType.StartThread) {
			this.state.callStack.PushThread();
		}
	}
	VisitContainer(container, atStart){
		if (!container.countingAtStartOnly || atStart) {
			if (container.visitsShouldBeCounted)
				this.IncrementVisitCountForContainer(container);

			if (container.turnIndexShouldBeCounted)
				this.RecordTurnIndexVisitToContainer(container);
		}
	}
	VisitChangedContainersDueToDivert(){
		var previousContentObject = this.state.previousContentObject;
		var newContentObject = this.state.currentContentObject;
		
		if (!newContentObject)
			return;
            
		// First, find the previously open set of containers
		this._prevContainerSet = [];
		if (previousContentObject) {
//			Container prevAncestor = previousContentObject as Container ?? previousContentObject.parent as Container;
			var prevAncestor = (previousContentObject instanceof Container) ? previousContentObject : previousContentObject.parent;
			while (prevAncestor instanceof Container) {
				this._prevContainerSet.push(prevAncestor);
//				prevAncestor = prevAncestor.parent as Container;
				prevAncestor = prevAncestor.parent;
			}
		}

		// If the new object is a container itself, it will be visited automatically at the next actual
		// content step. However, we need to walk up the new ancestry to see if there are more new containers
		var currentChildOfContainer = newContentObject;
//		Container currentContainerAncestor = currentChildOfContainer.parent as Container;
		var currentContainerAncestor = currentChildOfContainer.parent;
		while (currentContainerAncestor instanceof Container && this._prevContainerSet.indexOf(currentContainerAncestor) < 0) {

			// Check whether this ancestor container is being entered at the start,
			// by checking whether the child object is the first.
			var enteringAtStart = currentContainerAncestor.content.length > 0 
				&& currentChildOfContainer == currentContainerAncestor.content[0];

			// Mark a visit to this container
			this.VisitContainer(currentContainerAncestor, enteringAtStart);

			currentChildOfContainer = currentContainerAncestor;
//			currentContainerAncestor = currentContainerAncestor.parent as Container;
			currentContainerAncestor = currentContainerAncestor.parent;
		}
	}
	ProcessChoice(choicePoint){
		var showChoice = true;

		// Don't create choice if choice point doesn't pass conditional
		if (choicePoint.hasCondition) {
			var conditionValue = this.state.PopEvaluationStack();
			if (!this.IsTruthy(conditionValue)) {
				showChoice = false;
			}
		}

		var startText = "";
		var choiceOnlyText = "";

		if (choicePoint.hasChoiceOnlyContent) {
//			var choiceOnlyStrVal = state.PopEvaluationStack () as StringValue;
			var choiceOnlyStrVal = this.state.PopEvaluationStack();
			choiceOnlyText = choiceOnlyStrVal.value;
		}

		if (choicePoint.hasStartContent) {
//			var startStrVal = state.PopEvaluationStack () as StringValue;
			var startStrVal = this.state.PopEvaluationStack();
			startText = startStrVal.value;
		}

		// Don't create choice if player has already read this content
		if (choicePoint.onceOnly) {
			var visitCount = this.VisitCountForContainer(choicePoint.choiceTarget);
			if (visitCount > 0) {
				showChoice = false;
			}
		}

		var choice = new Choice(choicePoint);
		choice.threadAtGeneration = this.state.callStack.currentThread.Copy();

		// We go through the full process of creating the choice above so
		// that we consume the content for it, since otherwise it'll
		// be shown on the output stream.
		if (!showChoice) {
			return null;
		}

		// Set final text for the choice
		choice.text = startText + choiceOnlyText;

		return choice;
	}
	IsTruthy(obj){
		var truthy = false;
		if (obj instanceof Value) {
			var val = obj;

			if (val instanceof DivertTargetValue) {
				var divTarget = val;
				this.Error("Shouldn't use a divert target (to " + divTarget.targetPath + ") as a conditional value. Did you intend a function call 'likeThis()' or a read count check 'likeThis'? (no arrows)");
				return false;
			}

			return val.isTruthy;
		}
		return truthy;
	}
	PerformLogicAndFlowControl(contentObj){
		if( contentObj == null ) {
			return false;
		}

		// Divert
		if (contentObj instanceof Divert) {
			var currentDivert = contentObj;
			
			if (currentDivert.isConditional) {
				var conditionValue = this.state.PopEvaluationStack();

				// False conditional? Cancel divert
				if (!this.IsTruthy(conditionValue))
					return true;
			}
			
			if (currentDivert.hasVariableTarget) {
				var varName = currentDivert.variableDivertName;

				var varContents = this.state.variablesState.GetVariableWithName(varName);

				if (!(varContents instanceof DivertTargetValue)) {

//					var intContent = varContents as IntValue;
					var intContent = varContents;

					var errorMessage = "Tried to divert to a target from a variable, but the variable (" + varName + ") didn't contain a divert target, it ";
					if (intContent instanceof IntValue && intContent.value == 0) {
						errorMessage += "was empty/null (the value 0).";
					} else {
						errorMessage += "contained '" + varContents + "'.";
					}

					this.Error(errorMessage);
				}

				var target = varContents;
				this.state.divertedTargetObject = this.ContentAtPath(target.targetPath);

			} else if (currentDivert.isExternal) {
				this.CallExternalFunction(currentDivert.targetPathString, currentDivert.externalArgs);
				return true;
			} else {
				this.state.divertedTargetObject = currentDivert.targetContent;
			}

			if (currentDivert.pushesToStack) {
				this.state.callStack.Push(currentDivert.stackPushType);
			}

			if (this.state.divertedTargetObject == null && !currentDivert.isExternal) {

				// Human readable name available - runtime divert is part of a hard-written divert that to missing content
				if (currentDivert && currentDivert.debugMetadata.sourceName != null) {
					this.Error("Divert target doesn't exist: " + currentDivert.debugMetadata.sourceName);
				} else {
					this.Error("Divert resolution failed: " + currentDivert);
				}
			}

			return true;
		} 

		// Start/end an expression evaluation? Or print out the result?
		else if( contentObj instanceof ControlCommand ) {
			var evalCommand = contentObj;

			switch (evalCommand.commandType) {

			case ControlCommand.CommandType.EvalStart:
				if (this.state.inExpressionEvaluation) console.warn("Already in expression evaluation?");
				this.state.inExpressionEvaluation = true;
				break;

			case ControlCommand.CommandType.EvalEnd:
				if (!this.state.inExpressionEvaluation) console.warn("Not in expression evaluation mode");
				this.state.inExpressionEvaluation = false;
				break;

			case ControlCommand.CommandType.EvalOutput:

				// If the expression turned out to be empty, there may not be anything on the stack
				if (this.state.evaluationStack.length > 0) {

					var output = this.state.PopEvaluationStack();

					// Functions may evaluate to Void, in which case we skip output
					if (output != null && !(output instanceof Void)) {
						// TODO: Should we really always blanket convert to string?
						// It would be okay to have numbers in the output stream the
						// only problem is when exporting text for viewing, it skips over numbers etc.
						var text = new StringValue(output.toString());

						this.state.PushToOutputStream(text);
					}

				}
				break;

			case ControlCommand.CommandType.NoOp:
				break;

			case ControlCommand.CommandType.Duplicate:
				this.state.PushEvaluationStack(this.state.PeekEvaluationStack());
				break;

			case ControlCommand.CommandType.PopEvaluatedValue:
				this.state.PopEvaluationStack();
				break;

			case ControlCommand.CommandType.PopFunction:
			case ControlCommand.CommandType.PopTunnel:

				var popType = evalCommand.commandType == ControlCommand.CommandType.PopFunction ?
					PushPopType.Function : PushPopType.Tunnel;
					
				var overrideTunnelReturnTarget = null;
				if (popType == PushPopType.Tunnel) {
					var popped = this.state.PopEvaluationStack();
//					overrideTunnelReturnTarget = popped as DivertTargetValue;
					overrideTunnelReturnTarget = popped;
					if (overrideTunnelReturnTarget instanceof DivertTargetValue === false) {
						if (popped instanceof Void === false){
							throw "Expected void if ->-> doesn't override target";
						} else {
							overrideTunnelReturnTarget = null;
						}
					}
				}

				if (this.state.TryExitExternalFunctionEvaluation()){
					break;
				}
				else if (this.state.callStack.currentElement.type != popType || !this.state.callStack.canPop) {

					var names = {};
					names[PushPopType.Function] = "function return statement (~ return)";
					names[PushPopType.Tunnel] = "tunnel onwards statement (->->)";

					var expected = names[this.state.callStack.currentElement.type];
					if (!this.state.callStack.canPop)
						expected = "end of flow (-> END or choice)";

					var errorMsg = "Found " + names[popType] + ", when expected " + expected;

					this.Error(errorMsg);
				} 

				else {
					this.state.callStack.Pop();
					
					if (overrideTunnelReturnTarget)
						this.state.divertedTargetObject = this.ContentAtPath(overrideTunnelReturnTarget.targetPath);
				}
				break;

			case ControlCommand.CommandType.BeginString:
				this.state.PushToOutputStream(evalCommand);

				if (!this.state.inExpressionEvaluation) console.warn("Expected to be in an expression when evaluating a string");
				this.state.inExpressionEvaluation = false;
				break;

			case ControlCommand.CommandType.EndString:

				var contentStackForString = [];

				var outputCountConsumed = 0;
				for (var i = this.state.outputStream.length - 1; i >= 0; --i) {
					var obj = this.state.outputStream[i];

					outputCountConsumed++;

//					var command = obj as ControlCommand;
					var command = obj;
					if (command instanceof ControlCommand && command.commandType == ControlCommand.CommandType.BeginString) {
						break;
					}

					if( obj instanceof StringValue )
						contentStackForString.push(obj);
				}

				// Consume the content that was produced for this string
				this.state.outputStream.splice(this.state.outputStream.length - outputCountConsumed, outputCountConsumed);

				//the C# version uses a Stack for contentStackForString, but we're using a simple array, so we need to reverse it before using it
				contentStackForString = contentStackForString.reverse();
					
				// Build string out of the content we collected
				var sb = new StringBuilder();
				contentStackForString.forEach(c => {
					sb.Append(c.toString());
				});

				// Return to expression evaluation (from content mode)
				this.state.inExpressionEvaluation = true;
				this.state.PushEvaluationStack(new StringValue(sb.toString()));
				break;

			case ControlCommand.CommandType.ChoiceCount:
				var choiceCount = this.state.generatedChoices.length;
				this.state.PushEvaluationStack(new IntValue(choiceCount));
				break;

			case ControlCommand.CommandType.TurnsSince:
			case ControlCommand.CommandType.ReadCount:
				var target = this.state.PopEvaluationStack();
				if( !(target instanceof DivertTargetValue) ) {
					var extraNote = "";
					if( target instanceof IntValue )
						extraNote = ". Did you accidentally pass a read count ('knot_name') instead of a target ('-> knot_name')?";
					this.Error("TURNS_SINCE / READ_COUNT expected a divert target (knot, stitch, label name), but saw "+target+extraNote);
					break;
				}

//				var divertTarget = target as DivertTargetValue;
				var divertTarget = target;
//				var container = ContentAtPath (divertTarget.targetPath) as Container;
				var container = this.ContentAtPath(divertTarget.targetPath);

				var eitherCount; 
				if (evalCommand.commandType == ControlCommand.CommandType.TurnsSince)
					eitherCount = this.TurnsSinceForContainer(container);
				else
					eitherCount = this.VisitCountForContainer(container);

				this.state.PushEvaluationStack(new IntValue(eitherCount));
				break;

			case ControlCommand.CommandType.Random:
				var maxInt = this.state.PopEvaluationStack();
				var minInt = this.state.PopEvaluationStack();

				if (minInt == null || minInt instanceof IntValue === false)
					this.Error("Invalid value for minimum parameter of RANDOM(min, max)");

				if (maxInt == null || minInt instanceof IntValue === false)
					this.Error("Invalid value for maximum parameter of RANDOM(min, max)");

				// +1 because it's inclusive of min and max, for e.g. RANDOM(1,6) for a dice roll.
				var randomRange = maxInt.value - minInt.value + 1;
				if (randomRange <= 0)
					this.Error("RANDOM was called with minimum as " + minInt.value + " and maximum as " + maxInt.value + ". The maximum must be larger");

				var resultSeed = this.state.storySeed + this.state.previousRandom;
				var random = new PRNG(resultSeed);

				var nextRandom = random.next();
				var chosenValue = (nextRandom % randomRange) + minInt.value;
				this.state.PushEvaluationStack(new IntValue(chosenValue));

				// Next random number (rather than keeping the Random object around)
				this.state.previousRandom = nextRandom;
				break;
					
			case ControlCommand.CommandType.SeedRandom:
				var seed = this.state.PopEvaluationStack();
				if (seed == null || seed instanceof IntValue === false)
					this.Error("Invalid value passed to SEED_RANDOM");

				// Story seed affects both RANDOM and shuffle behaviour
				this.state.storySeed = seed.value;
				this.state.previousRandom = 0;

				// SEED_RANDOM returns nothing.
				this.state.PushEvaluationStack(new Void());
				break;
					
			case ControlCommand.CommandType.VisitIndex:
				var count = this.VisitCountForContainer(this.state.currentContainer) - 1; // index not count
				this.state.PushEvaluationStack(new IntValue(count));
				break;

			case ControlCommand.CommandType.SequenceShuffleIndex:
				var shuffleIndex = this.NextSequenceShuffleIndex();
				this.state.PushEvaluationStack(new IntValue(shuffleIndex));
				break;

			case ControlCommand.CommandType.StartThread:
				// Handled in main step function
				break;

			case ControlCommand.CommandType.Done:

				// We may exist in the context of the initial
				// act of creating the thread, or in the context of
				// evaluating the content.
				if (this.state.callStack.canPopThread) {
					this.state.callStack.PopThread();
				} 

				// In normal flow - allow safe exit without warning
				else {
					this.state.didSafeExit = true;
					
					// Stop flow in current thread
					this.state.currentContentObject = null;
				}

				break;

			// Force flow to end completely
			case ControlCommand.CommandType.End:
				this.state.ForceEnd();
				break;
					
			case ControlCommand.CommandType.ListFromInt:
//				var intVal = state.PopEvaluationStack () as IntValue;
				var intVal = parseInt(this.state.PopEvaluationStack());
//				var listNameVal = state.PopEvaluationStack () as StringValue;
				var listNameVal = this.state.PopEvaluationStack().toString();

				var generatedListValue = null;

				var foundListDef;
				if (foundListDef = this.listDefinitions.TryGetDefinition(listNameVal, foundListDef)) {
					var foundItem = foundListDef.TryGetItemWithValue(intVal.value);
					if (foundItem.exists) {
						generatedListValue = new ListValue(foundItem.item, intVal.value);
					}
				} else {
					throw new StoryException("Failed to find LIST called " + listNameVal.value);
				}

				if (generatedListValue == null)
					generatedListValue = new ListValue();

				this.state.PushEvaluationStack(generatedListValue);
				break;
					
			case ControlCommand.CommandType.ListRange:
				var max = this.state.PopEvaluationStack();
				var min = this.state.PopEvaluationStack();

//				var targetList = state.PopEvaluationStack () as ListValue;
				var targetList = this.state.PopEvaluationStack();

				if (targetList instanceof ListValue === false || targetList == null || min == null || max == null)
					throw new StoryException("Expected list, minimum and maximum for LIST_RANGE");

				// Allow either int or a particular list item to be passed for the bounds,
				// so wrap up a function to handle this casting for us.
				var IntBound = function IntBound(obj){
//					var listValue = obj as ListValue;
					var listValue = obj;
					if (listValue instanceof ListValue) {
						return parseInt(listValue.value.maxItem.Value);
					}

//					var intValue = obj as IntValue;
					var intValue = obj;
					if (intValue instanceof IntValue) {
						return intValue.value;
					}

					return -1;
				}

				var minVal = IntBound(min);
				var maxVal = IntBound(max);
				if (minVal == -1)
					throw new StoryException("Invalid min range bound passed to LIST_VALUE(): " + min);

				if (maxVal == -1)
					throw new StoryException("Invalid max range bound passed to LIST_VALUE(): " + max);

				// Extract the range of items from the origin list
				var result = new ListValue();
				var origins = targetList.value.origins;

				if (origins != null) {
					origins.forEach(function(origin){
						var rangeFromOrigin = origin.ListRange(minVal, maxVal);
						rangeFromOrigin.value.forEach(function(kv){
							result.value.Add(kv.Key, kv.Value);
						});
					});
				}

				this.state.PushEvaluationStack(result);
				break;

			default:
				this.Error("unhandled ControlCommand: " + evalCommand);
				break;
			}

			return true;
		}

		// Variable assignment
		else if( contentObj instanceof VariableAssignment ) {
			var varAss = contentObj;
			var assignedVal = this.state.PopEvaluationStack();
			
			// When in temporary evaluation, don't create new variables purely within
			// the temporary context, but attempt to create them globally
			//var prioritiseHigherInCallStack = _temporaryEvaluationContainer != null;

			this.state.variablesState.Assign(varAss, assignedVal);

			return true;
		}

		// Variable reference
		else if( contentObj instanceof VariableReference ) {
			var varRef = contentObj;
			var foundValue = null;


			// Explicit read count value
			if (varRef.pathForCount != null) {

				var container = varRef.containerForCount;
				var count = this.VisitCountForContainer(container);
				foundValue = new IntValue(count);
			}

			// Normal variable reference
			else {

				foundValue = this.state.variablesState.GetVariableWithName(varRef.name);

				if (foundValue == null) {
					this.Error("Uninitialised variable: " + varRef.name);
					foundValue = new IntValue(0);
				}
			}

			this.state.PushEvaluationStack(foundValue);

			return true;
		}

		// Native function call
		else if (contentObj instanceof NativeFunctionCall) {
			var func = contentObj;
			var funcParams = this.state.PopEvaluationStack(func.numberOfParameters);
			var result = func.Call(funcParams);
			this.state.PushEvaluationStack(result);
			return true;
		}

		// No control content, must be ordinary content
		return false;
	}
	ChoosePathString(path, args){
		args = args || [];
		this.state.PassArgumentsToEvaluationStack(args);
		this.ChoosePath(new Path(path));
	}
	ChoosePath(p){
		this.state.SetChosenPath(p);

		// Take a note of newly visited containers for read counts etc
		this.VisitChangedContainersDueToDivert();
	}
	ChooseChoiceIndex(choiceIdx){
		choiceIdx = choiceIdx;
		var choices = this.currentChoices;
		if (choiceIdx < 0 || choiceIdx > choices.length) console.warn("choice out of range");

		// Replace callstack with the one from the thread at the choosing point, 
		// so that we can jump into the right place in the flow.
		// This is important in case the flow was forked by a new thread, which
		// can create multiple leading edges for the story, each of
		// which has its own context.
		var choiceToChoose = choices[choiceIdx];
		this.state.callStack.currentThread = choiceToChoose.threadAtGeneration;

		this.ChoosePath(choiceToChoose.choicePoint.choiceTarget.path);
	}
	HasFunction(functionName){
		try {
			return this.ContentAtPath(new Path(functionName)) instanceof Container;
		} catch(e) {
			return false;
		}
	}
	EvaluateFunction(functionName, args, returnTextOutput){
		//EvaluateFunction behaves slightly differently than the C# version. In C#, you can pass a (second) parameter `out textOutput` to get the text outputted by the function. This is not possible in js. Instead, we maintain the regular signature (functionName, args), plus an optional third parameter returnTextOutput. If set to true, we will return both the textOutput and the returned value, as an object.
		returnTextOutput = !!returnTextOutput;
		
		if (functionName == null) {
			throw "Function is null";
		} 
		else if (functionName == '' || functionName.trim() == '') {
			throw "Function is empty or white space.";
		}

		var funcContainer = null;
		try {
			funcContainer = this.ContentAtPath(new Path(functionName));
		} catch (e) {
			if (e.message.indexOf("not found") >= 0)
				throw "Function doesn't exist: '" + functionName + "'";
			else
				throw e;
		}
		
		this.state.StartExternalFunctionEvaluation(funcContainer, args);
		
		// Evaluate the function, and collect the string output
		var stringOutput = new StringBuilder();
		while (this.canContinue) {
			stringOutput.Append(this.Continue());
		}
		var textOutput = stringOutput.toString();
		
		var result = this.state.CompleteExternalFunctionEvaluation();

		return (returnTextOutput) ? {'returned': result, 'output': textOutput} : result;
	}
	EvaluateExpression(exprContainer){
		var startCallStackHeight = this.state.callStack.elements.length;

		this.state.callStack.Push(PushPopType.Tunnel);

		this._temporaryEvaluationContainer = exprContainer;

		this.state.GoToStart();

		var evalStackHeight = this.state.evaluationStack.length;

		this.Continue();

		this._temporaryEvaluationContainer = null;

		// Should have fallen off the end of the Container, which should
		// have auto-popped, but just in case we didn't for some reason,
		// manually pop to restore the state (including currentPath).
		if (this.state.callStack.elements.length > startCallStackHeight) {
			this.state.callStack.Pop();
		}

		var endStackHeight = this.state.evaluationStack.length;
		if (endStackHeight > evalStackHeight) {
			return this.state.PopEvaluationStack();
		} else {
			return null;
		}
	}
	CallExternalFunction(funcName, numberOfArguments){
		var func = this._externals[funcName];
		var fallbackFunctionContainer = null;

		var foundExternal = typeof func !== 'undefined';

		// Try to use fallback function?
		if (!foundExternal) {
			if (this.allowExternalFunctionFallbacks) {
//				fallbackFunctionContainer = ContentAtPath (new Path (funcName)) as Container;
				fallbackFunctionContainer = this.ContentAtPath(new Path(funcName));
				if (!(fallbackFunctionContainer instanceof Container)) console.warn("Trying to call EXTERNAL function '" + funcName + "' which has not been bound, and fallback ink function could not be found.");

				// Divert direct into fallback function and we're done
				this.state.callStack.Push(PushPopType.Function);
				this.state.divertedTargetObject = fallbackFunctionContainer;
				return;

			} else {
				console.warn("Trying to call EXTERNAL function '" + funcName + "' which has not been bound (and ink fallbacks disabled).");
			}
		}

		// Pop arguments
		var args = [];
		for (var i = 0; i < numberOfArguments; ++i) {
//			var poppedObj = state.PopEvaluationStack () as Value;
			var poppedObj = this.state.PopEvaluationStack();
			var valueObj = poppedObj.valueObject;
			args.push(valueObj);
		}

		// Reverse arguments from the order they were popped,
		// so they're the right way round again.
		args.reverse();

		// Run the function!
		var funcResult = func(args);

		// Convert return value (if any) to the a type that the ink engine can use
		var returnObj = null;
		if (funcResult != null) {
			returnObj = Value.Create(funcResult);
			if (returnObj == null) console.warn("Could not create ink value from returned object of type " + (typeof funcResult));
		} else {
			returnObj = new Void();
		}

		this.state.PushEvaluationStack(returnObj);
	}
	TryCoerce(value){
		//we're skipping type coercition in this implementation. First of, js is loosely typed, so it's not that important. Secondly, there is no clean way (AFAIK) for the user to describe what type of parameters he/she expects.
		return value;
	}
	BindExternalFunctionGeneral(funcName, func){
		if (this._externals[funcName]) console.warn("Function '" + funcName + "' has already been bound.");
		this._externals[funcName] = func;
	}
	BindExternalFunction(funcName, func){
		if (!func) console.warn("Can't bind a null function");

		this.BindExternalFunctionGeneral(funcName, (args) => {
			if (args.length < func.length) console.warn("External function expected " + func.length + " arguments");
			
			var coercedArgs = [];
			for (var i = 0, l = args.length; i < l; i++){
				coercedArgs[i] = this.TryCoerce(args[i]);
			}
			return func.apply(null, coercedArgs);
		});
	}
	UnbindExternalFunction(funcName){
		if (typeof this._externals[funcName] === 'undefined') console.warn("Function '" + funcName + "' has not been bound.");
		delete this._externals[funcName];
	}
	ValidateExternalBindings(containerOrObject, missingExternals){
		if (!containerOrObject){
			var missingExternals = [];
			this.ValidateExternalBindings(this._mainContentContainer, missingExternals);
            this._hasValidatedExternals = true;
			
			// No problem! Validation complete
			if( missingExternals.length == 0 ) {
				this._hasValidatedExternals = true;
			} 

			// Error for all missing externals
			else {
				var message = "Error: Missing function binding for external";
				message += (missingExternals.length > 1) ? "s" : "";
				message += ": '";
				message += missingExternals.join("', '");
				message += "' ";
				message += (this.allowExternalFunctionFallbacks) ? ", and no fallback ink function found." : " (ink fallbacks disabled)";

				this.Error(message);
			}
		}
		else if (containerOrObject instanceof Container){
			var c = containerOrObject;
			
			c.content.forEach(innerContent => {
				this.ValidateExternalBindings(innerContent, missingExternals);
			});
			for (var key in c.namedContent){
				this.ValidateExternalBindings(c.namedContent[key], missingExternals);
			}
		}
		else{
			var o = containerOrObject;
			//the following code is already taken care of above in this implementation
//			var container = o as Container;
//            if (container) {
//                ValidateExternalBindings (container, missingExternals);
//                return;
//            }

//            var divert = o as Divert;
            var divert = o;
            if (divert instanceof Divert && divert.isExternal) {
                var name = divert.targetPathString;

                if (!this._externals[name]) {
					if( this.allowExternalFunctionFallbacks ) {
						var fallbackFound = !!this.mainContentContainer.namedContent[name];
						if( !fallbackFound ) {
							missingExternals.push(name);
						}
					} else {
						missingExternals.push(name);
					}
                }
            }
		}
	}
	ObserveVariable(variableName, observer){
		if (this._variableObservers == null)
			this._variableObservers = {};

		if (this._variableObservers[variableName]) {
			this._variableObservers[variableName].push(observer);
		} else {
			this._variableObservers[variableName] = [observer];
		}
	}
	ObserveVariables(variableNames, observers){
		for (var i = 0, l = variableNames.length; i < l; i++){
			this.ObserveVariable(variableNames[i], observers[i]);
		}
	}
	RemoveVariableObserver(observer, specificVariableName){
		if (this._variableObservers == null)
			return;

		// Remove observer for this specific variable
		if (typeof specificVariableName !== 'undefined') {
			if (this._variableObservers[specificVariableName]) {
				this._variableObservers[specificVariableName].splice(this._variableObservers[specificVariableName].indexOf(observer), 1);
			}
		} 

		// Remove observer for all variables
		else {
			for (var varName in this._variableObservers){
				this._variableObservers[varName].splice(this._variableObservers[varName].indexOf(observer), 1);
			}
		}
	}
	VariableStateDidChangeEvent(variableName, newValueObj){
		if (this._variableObservers == null)
			return;
		
		var observers = this._variableObservers[variableName];
		if (typeof observers !== 'undefined') {

			if (!(newValueObj instanceof Value)) {
				throw "Tried to get the value of a variable that isn't a standard type";
			}
//			var val = newValueObj as Value;
			var val = newValueObj;

			observers.forEach(function(observer){
				observer(variableName, val.valueObject);
			});
		}
	}
	TagsForContentAtPath(path){
		return this.TagsAtStartOfFlowContainerWithPathString(path);
	}
	TagsAtStartOfFlowContainerWithPathString(pathString){
		var path = new Path(pathString);

		// Expected to be global story, knot or stitch
//		var flowContainer = ContentAtPath (path) as Container;
		var flowContainer = this.ContentAtPath(path);
		while(true) {
			var firstContent = flowContainer.content[0];
			if (firstContent instanceof Container)
				flowContainer = firstContent;
			else break;
		}
		

		// Any initial tag objects count as the "main tags" associated with that story/knot/stitch
		var tags = null;
		
		flowContainer.content.every(c => {
//			var tag = c as Runtime.Tag;
			var tag = c;
			if (tag instanceof Tag) {
				if (tags == null) tags = [];
				tags.push(tag.text);
				return true;
			} else return false;
		});

		return tags;
	}
	BuildStringOfHierarchy(){
		var sb = new StringBuilder();

		this.mainContentContainer.BuildStringOfHierarchy(sb, 0, this.state.currentContentObject);

    return sb.toString();
	}
	BuildStringOfContainer(container){
		var sb = new StringBuilder();
		container.BuildStringOfHierarchy(sb, 0, this.state.currentContentObject);
		return sb.toString();
	}
	NextContent(){
		// Setting previousContentObject is critical for VisitChangedContainersDueToDivert
		this.state.previousContentObject = this.state.currentContentObject;
		
		// Divert step?
		if (this.state.divertedTargetObject != null) {

			this.state.currentContentObject = this.state.divertedTargetObject;
			this.state.divertedTargetObject = null;

			// Internally uses state.previousContentObject and state.currentContentObject
			this.VisitChangedContainersDueToDivert();

			// Diverted location has valid content?
			if (this.state.currentContentObject != null) {
				return;
			}

			// Otherwise, if diverted location doesn't have valid content,
			// drop down and attempt to increment.
			// This can happen if the diverted path is intentionally jumping
			// to the end of a container - e.g. a Conditional that's re-joining
		}

		var successfulPointerIncrement = this.IncrementContentPointer();

		// Ran out of content? Try to auto-exit from a function,
		// or finish evaluating the content of a thread
		if (!successfulPointerIncrement) {

			var didPop = false;

			if (this.state.callStack.CanPop(PushPopType.Function)) {

				// Pop from the call stack
				this.state.callStack.Pop(PushPopType.Function);

				// This pop was due to dropping off the end of a function that didn't return anything,
				// so in this case, we make sure that the evaluator has something to chomp on if it needs it
				if (this.state.inExpressionEvaluation) {
					this.state.PushEvaluationStack(new Void());
				}

				didPop = true;
			} 

			else if (this.state.callStack.canPopThread) {
				this.state.callStack.PopThread();

				didPop = true;
			}
			else {
				this.state.TryExitExternalFunctionEvaluation();
			}

			// Step past the point where we last called out
			if (didPop && this.state.currentContentObject != null) {
				this.NextContent();
			}
		}
	}
	IncrementContentPointer(){
		var successfulIncrement = true;

		var currEl = this.state.callStack.currentElement;
		currEl.currentContentIndex++;

		// Each time we step off the end, we fall out to the next container, all the
		// while we're in indexed rather than named content
		while (currEl.currentContentIndex >= currEl.currentContainer.content.length) {

			successfulIncrement = false;

//			Container nextAncestor = currEl.currentContainer.parent as Container;
			var nextAncestor = currEl.currentContainer.parent;
			if (nextAncestor instanceof Container === false) {
				break;
			}

			var indexInAncestor = nextAncestor.content.indexOf(currEl.currentContainer);
			if (indexInAncestor == -1) {
				break;
			}

			currEl.currentContainer = nextAncestor;
			currEl.currentContentIndex = indexInAncestor + 1;

			successfulIncrement = true;
		}

		if (!successfulIncrement)
			currEl.currentContainer = null;

		return successfulIncrement;
	}
	TryFollowDefaultInvisibleChoice(){
		var allChoices = this._state.currentChoices;

		// Is a default invisible choice the ONLY choice?
		var invisibleChoices = allChoices.filter(c => {
			return c.choicePoint.isInvisibleDefault;
		});
		if (invisibleChoices.length == 0 || allChoices.length > invisibleChoices.length)
			return false;

		var choice = invisibleChoices[0];

		this.ChoosePath(choice.choicePoint.choiceTarget.path);

		return true;
	}
	VisitCountForContainer(container){
		if( !container.visitsShouldBeCounted ) {
			console.warn("Read count for target ("+container.name+" - on "+container.debugMetadata+") unknown. The story may need to be compiled with countAllVisits flag (-c).");
			return 0;
		}

		var count = 0;
		var containerPathStr = container.path.toString();
		count = this.state.visitCounts[containerPathStr] || count;
		return count;
	}
	IncrementVisitCountForContainer(container){
		var count = 0;
		var containerPathStr = container.path.toString();
		if (this.state.visitCounts[containerPathStr]) count = this.state.visitCounts[containerPathStr];
		count++;
		this.state.visitCounts[containerPathStr] = count;
	}
	RecordTurnIndexVisitToContainer(container){
		var containerPathStr = container.path.toString();
		this.state.turnIndices[containerPathStr] = this.state.currentTurnIndex;
	}
	TurnsSinceForContainer(container){
		if( !container.turnIndexShouldBeCounted ) {
			this.Error("TURNS_SINCE() for target ("+container.name+" - on "+container.debugMetadata+") unknown. The story may need to be compiled with countAllVisits flag (-c).");
		}
		
		var containerPathStr = container.path.toString();
		var index = this.state.turnIndices[containerPathStr];
		if (typeof index !== 'undefined') {
			return this.state.currentTurnIndex - index;
		} else {
			return -1;
		}
	}
	NextSequenceShuffleIndex(){
//		var numElementsIntVal = state.PopEvaluationStack () as IntValue;
		var numElementsIntVal = this.state.PopEvaluationStack();
		if (!(numElementsIntVal instanceof IntValue)) {
			this.Error("expected number of elements in sequence for shuffle index");
			return 0;
		}

		var seqContainer = this.state.currentContainer;

		var numElements = numElementsIntVal.value;

//		var seqCountVal = state.PopEvaluationStack () as IntValue;
		var seqCountVal = this.state.PopEvaluationStack();
		var seqCount = seqCountVal.value;
		var loopIndex = seqCount / numElements;
		var iterationIndex = seqCount % numElements;

		// Generate the same shuffle based on:
		//  - The hash of this container, to make sure it's consistent
		//    each time the runtime returns to the sequence
		//  - How many times the runtime has looped around this full shuffle
		var seqPathStr = seqContainer.path.toString();
		var sequenceHash = 0;
		for (var i = 0, l = seqPathStr.length; i < l; i++){
			sequenceHash += seqPathStr.charCodeAt[i] || 0;
		}
		var randomSeed = sequenceHash + loopIndex + this.state.storySeed;
		var random = new PRNG(parseInt(randomSeed));

		var unpickedIndices = [];
		for (var i = 0; i < numElements; ++i) {
			unpickedIndices.push(i);
		}

		for (var i = 0; i <= iterationIndex; ++i) {
			var chosen = random.next() % unpickedIndices.length;
			var chosenIndex = unpickedIndices[chosen];
			unpickedIndices.splice(chosen, 1);

			if (i == iterationIndex) {
				return chosenIndex;
			}
		}

		throw "Should never reach here";
	}
	Error(message, useEndLineNumber){
		var e = new StoryException(message);
//		e.useEndLineNumber = useEndLineNumber;
		throw e;
	}
	AddError(message, useEndLineNumber){
//		var dm = this.currentDebugMetadata;
		var dm = null;
		
		if (dm != null) {
			var lineNum = useEndLineNumber ? dm.endLineNumber : dm.startLineNumber;
			message = "RUNTIME ERROR: '" + dm.fileName + "' line " + lineNum + ": " + message;
		}
		else {
			message = "RUNTIME ERROR: " + message;
		}

		this.state.AddError(message);
		
		// In a broken state don't need to know about any other errors.
		this.state.ForceEnd();
	}
}
