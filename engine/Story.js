import {Container} from './Container';
import {Object as InkObject} from './Object';
import {JsonSerialisation} from './JsonSerialisation';
import {StoryState} from './StoryState';
import {ControlCommand} from './ControlCommand';
import {PushPopType} from './PushPop';
import {ChoicePoint} from './ChoicePoint';
import {Choice} from './Choice';
import {Divert} from './Divert';
import {Value, StringValue, IntValue, DivertTargetValue, VariablePointerValue} from './Value';
import {Path} from './Path';
import {Void} from './Void';
import {Branch} from './Branch';
import {VariableAssignment} from './VariableAssignment';
import {VariableReference} from './VariableReference';
import {NativeFunctionCall} from './NativeFunctionCall';
import {PRNG} from './PRNG';

export class Story extends InkObject{
	constructor(jsonString){
		super();
		
		this.inkVersionCurrent = 11;
		this.inkVersionMinimumCompatible = 11;
		
		this._variableObservers = null;
		
		if (jsonString instanceof Container){
			this._mainContentContainer = jsonString;
            this._externals = {};
		}
		else{
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
				console.warn("WARNING: Version of ink used to build story doesn't match current version of engine. Non-critical, but recommend synchronising.");
			}

			var rootToken = rootObject["root"];
			if (rootToken == null)
				throw "Root node for ink not found. Are you sure it's a valid .ink.json file?";

			this._mainContentContainer = JsonSerialisation.JTokenToRuntimeObject(rootToken);

			this._hasValidatedExternals = true;

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
	get currentErrors(){
		return this.state.currentErrors;
	}
	get hasError(){
		return this.state.hasError;
	}
	get variablesState(){
		return this.state.variablesState;
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
		return this.state.currentContentObject != null && !this.state.hasError;
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
		this._state.ForceEndFlow();
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
			throw "Can't continue - should check canContinue before calling Continue";
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

						// Output has been extended?
						if( currText !== stateAtLastNewline.currentText ) {

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
							stateAtLastNewline = this.StateSnapshot();
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
					throw "Thread available to pop, threads should always be flat by the end of evaluation?";
				}

				if( this.currentChoices.length == 0 && !this.state.didSafeExit ) {
					if( this.state.callStack.CanPop(PushPopType.Tunnel) ) {
						throw "unexpectedly reached end of content. Do you need a '->->' to return from a tunnel?";
					} else if( this.state.callStack.CanPop(PushPopType.Function) ) {
						throw "unexpectedly reached end of content. Do you need a '~ return'?";
					} else if( !this.state.callStack.canPop ) {
						throw "ran out of content. Do you need a '-> DONE' or '-> END'?";
					} else {
						throw "unexpectedly reached end of content for unknown reason. Please debug compiler!";
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
		var sb = '';

		while (this.canContinue) {
			sb += this.Continue();
		}

		return sb;
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
				this.state.currentChoices.push(choice);
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
	VisitChangedContainersDueToDivert(previousContentObject, newContentObject){
		if (!previousContentObject || !newContentObject)
                return;
            
		// First, find the previously open set of containers
		var prevContainerSet = [];
//		Container prevAncestor = previousContentObject as Container ?? previousContentObject.parent as Container;
		var prevAncestor = (previousContentObject instanceof Container) ? previousContentObject : previousContentObject.parent;
		while (prevAncestor instanceof Container) {
			prevContainerSet.push(prevAncestor);
//			prevAncestor = prevAncestor.parent as Container;
			prevAncestor = prevAncestor.parent;
		}

		// If the new object is a container itself, it will be visited automatically at the next actual
		// content step. However, we need to walk up the new ancestry to see if there are more new containers
		var currentChildOfContainer = newContentObject;
//		Container currentContainerAncestor = currentChildOfContainer.parent as Container;
		var currentContainerAncestor = currentChildOfContainer.parent;
		while (currentContainerAncestor instanceof Container && prevContainerSet.indexOf(currentContainerAncestor) < 0) {

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

		// Branch (conditional divert)
		else if (contentObj instanceof Branch) {
			var branch = contentObj;
			var conditionValue = this.state.PopEvaluationStack();

			if (this.IsTruthy(conditionValue))
				this.state.divertedTargetObject = branch.trueDivert.targetContent;
			else if (branch.falseDivert)
				this.state.divertedTargetObject = branch.falseDivert.targetContent;

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
					if (!(output instanceof Void)) {
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

				if (this.state.callStack.currentElement.type != popType || !this.state.callStack.canPop) {

					var names = new {};
					names[PushPopType.Function] = "function return statement (~ return)";
					names[PushPopType.Tunnel] = "tunnel onwards statement (->->)";

					var expected = names[this.state.callStack.currentElement.type];
					if (!this.state.callStack.canPop) {
						expected = "end of flow (-> END or choice)";
					}

					var errorMsg = "Found " + names[popType] + ", when expected " + expected;

					this.Error(errorMsg);
				} 

				else {
					this.state.callStack.Pop();
				}
				break;

			case ControlCommand.CommandType.BeginString:
				this.state.PushToOutputStream(evalCommand);

				if (!this.state.inExpressionEvaluation) console.warn("Expected to be in an expression when evaluating a string");
				this.state.inExpressionEvaluation = false;
				break;

			case ControlCommand.CommandType.EndString:

				// Since we're iterating backward through the content,
				// build a stack so that when we build the string,
				// it's in the right order
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

				// Build string out of the content we collected
				var sb = '';
				contentStackForString.forEach(c => {
					sb += c.toString();
				});

				// Return to expression evaluation (from content mode)
				this.state.inExpressionEvaluation = true;
				this.state.PushEvaluationStack(new StringValue(sb));
				break;

			case ControlCommand.CommandType.ChoiceCount:
				var choiceCount = this.currentChoices.length;
				this.state.PushEvaluationStack(new IntValue(choiceCount));
				break;

			case ControlCommand.CommandType.TurnsSince:
				var target = this.state.PopEvaluationStack();
				if( !(target instanceof DivertTargetValue) ) {
					var extraNote = "";
					if( target instanceof IntValue )
						extraNote = ". Did you accidentally pass a read count ('knot_name') instead of a target ('-> knot_name')?";
					this.Error("TURNS_SINCE expected a divert target (knot, stitch, label name), but saw "+target+extraNote);
					break;
				}

//				var divertTarget = target as DivertTargetValue;
				var divertTarget = target;
//				var container = ContentAtPath (divertTarget.targetPath) as Container;
				var container = this.ContentAtPath(divertTarget.targetPath);
				var turnCount = this.TurnsSinceForContainer(container);
				this.state.PushEvaluationStack(new IntValue(turnCount));
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
				}

				break;

			// Force flow to end completely
			case ControlCommand.CommandType.End:
				this.state.ForceEndFlow();
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

			this.state.evaluationStack.push( foundValue );

			return true;
		}

		// Native function call
		else if( contentObj instanceof NativeFunctionCall ) {
			var func = contentObj;
			var funcParams = this.state.PopEvaluationStack(func.numberOfParameters);
			var result = func.Call(funcParams);
			this.state.evaluationStack.push(result);
			return true;
		}

		// No control content, must be ordinary content
		return false;
	}
	ChoosePathString(path){
		this.ChoosePath(new Path(path));
	}
	ChoosePath(path){
		var prevContentObj = this.state.currentContentObject;

		this.state.SetChosenPath(path);

		var newContentObj = this.state.currentContentObject;

		// Take a note of newly visited containers for read counts etc
		this.VisitChangedContainersDueToDivert(prevContentObj, newContentObj);
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
	/*
	external funcs
	*/
	
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
		if (typeof newValueObj !== 'undefined') {

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
	BuildStringOfHierarchy(){
		var sb = "";

		this.mainContentContainer.BuildStringOfHierarchy(sb, 0, this.state.currentContentObject);

        return sb.toString();
	}
	NextContent(){
		// Divert step?
		if (this.state.divertedTargetObject != null) {

			var prevObj = this.state.currentContentObject;

			this.state.currentContentObject = this.state.divertedTargetObject;
			this.state.divertedTargetObject = null;

			// Check for newly visited containers
			// Rather than using state.currentContentObject and state.divertedTargetObject,
			// we have to make sure that both come via the state.currentContentObject property,
			// since it can actually get transformed slightly when set (it can end up stepping 
			// into a container).
			this.VisitChangedContainersDueToDivert(prevObj, this.state.currentContentObject);

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
	/*
	TurnsSinceForContainer
	*/
	NextSequenceShuffleIndex(){
//		var numElementsIntVal = state.PopEvaluationStack () as IntValue;
		var numElementsIntVal = this.state.PopEvaluationStack();
		if (!(numElementsIntVal instanceof IntValue)) {
			this.Error("expected number of elements in sequence for shuffle index");
			return 0;
		}

		var seqContainer = this.state.currentContainer;

		var numElements = numElementsIntVal.value;

		var seqCount = this.VisitCountForContainer(seqContainer);
		var loopIndex = seqCount / numElements;
		var iterationIndex = seqCount % numElements;

		// Generate the same shuffle based on:
		//  - The hash of this container, to make sure it's consistent
		//    each time the runtime returns to the sequence
		//  - How many times the runtime has looped around this full shuffle
		var seqPathStr = seqContainer.path.toString();
		var sequenceHash = 0;
		for (var i = 0, l = seqPathStr.length; i < l; i++){
			sequenceHash += parseInt(seqPathStr[i]) || 0;
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
		var e = new Error(message);
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
	}
}