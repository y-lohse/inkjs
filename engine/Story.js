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
import {Stopwatch} from './StopWatch';
import {Pointer} from './Pointer';
export {InkList} from './InkList';

if (!Number.isInteger) {
	Number.isInteger = function isInteger (nVal) {
		return typeof nVal === "number" && isFinite(nVal) && nVal > -9007199254740992 && nVal < 9007199254740992 && Math.floor(nVal) === nVal;
	};
}

export class Story extends InkObject{
	constructor(jsonString, lists){
		super();

		lists = lists || null;

		this.inkVersionCurrent = 18;
		this.inkVersionMinimumCompatible = 18;

		this._variableObservers = null;
		this._externals = {};
		this._prevContainers = [];
		this._listDefinitions = null;

		this._asyncContinueActive;
		this._stateAtLastNewline = null;
		this._recursiveContinueCount = 0;
		this._temporaryEvaluationContainer = null;

		this._profiler = null;

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
				throw "Version of ink used to build story was newer than the current version of the engine";
			}
			else if (formatFromFile < this.inkVersionMinimumCompatible){
				throw "Version of ink used to build story is too old to be loaded by this version of the engine";
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
			if (!c.isInvisibleDefault) {
				c.index = choices.length;
				choices.push(c);
			}
		});

		return choices;
	}
	get currentText(){
		this.IfAsyncWeCant("call currentText since it's a work in progress");
		return this.state.currentText;
	}
	get currentTags(){
		this.IfAsyncWeCant("call currentTags since it's a work in progress");
		return this.state.currentTags;
	}
	get currentErrors(){
		return this.state.currentErrors;
	}
	get currentWarnings(){
		return this.state.currentWarnings;
	}
	get hasError(){
		return this.state.hasError;
	}
	get hasWarning(){
		return this.state.hasWarning;
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
	get asyncContinueComplete(){
		return !this._asyncContinueActive;
	}

	get globalTags(){
		return this.TagsAtStartOfFlowContainerWithPathString("");
	}

	// TODO: Implement Profiler
	StartProfiling(){}
	EndProfiling(){}
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
		this.IfAsyncWeCant("ResetState");

		this._state = new StoryState(this);
		this._state.variablesState.ObserveVariableChange(this.VariableStateDidChangeEvent.bind(this));

		this.ResetGlobals();
	}
	ResetErrors(){
		this._state.ResetErrors();
	}
	ResetCallstack(){
		this.IfAsyncWeCant("ResetCallstack");
		this._state.ForceEnd();
	}
	ResetGlobals(){
		if (this._mainContentContainer.namedContent["global decl"]){
			var originalPointer = this.state.currentPointer.copy();

			this.ChoosePathString("global decl", false);

			// Continue, but without validating external bindings,
			// since we may be doing this reset at initialisation time.
			this.ContinueInternal();

			this.state.currentPointer = originalPointer
		}

		this.state.variablesState.SnapshotDefaultGlobals();
	}
	Continue(){
		this.ContinueAsync(0);
		return this.currentText;
	}
	ContinueAsync(millisecsLimitAsync){
		if (!this._hasValidatedExternals)
			this.ValidateExternalBindings();

		this.ContinueInternal(millisecsLimitAsync)
	}
	ContinueInternal(millisecsLimitAsync){
		millisecsLimitAsync = (typeof millisecsLimitAsync !== 'undefined') ? millisecsLimitAsync : 0;

		if (this._profiler != null)
			this._profiler.PreContinue();

		var isAsyncTimeLimited = millisecsLimitAsync > 0;
		this._recursiveContinueCount++;

		if (!this._asyncContinueActive) {
			this._asyncContinueActive = isAsyncTimeLimited;

			if (!this.canContinue) {
				throw new StoryException("Can't continue - should check canContinue before calling Continue");
			}

			this._state.didSafeExit = false;
			this._state.ResetOutput();

			if (this._recursiveContinueCount == 1)
				this._state.variablesState.batchObservingVariableChanges = true;
		}

		var durationStopwatch = new Stopwatch();
		durationStopwatch.Start();

		var outputStreamEndsInNewline = false;
		do {
			try {
				outputStreamEndsInNewline = this.ContinueSingleStep();
			} catch (e) {
				if (!(e instanceof StoryException)) throw e;

				this.AddError(e.Message, undefined, e.useEndLineNumber)
				break;
			}

			if (outputStreamEndsInNewline)
				break;


			if (this._asyncContinueActive && durationStopwatch.ElapsedMilliseconds > millisecsLimitAsync) {
				break;
			}

		} while(this.canContinue);

		durationStopwatch.Stop();

		if (outputStreamEndsInNewline || !this.canContinue) {
			if (this._stateAtLastNewline != null) {
				this.RestoreStateSnapshot(this._stateAtLastNewline);
				this._stateAtLastNewline = null;
			}

			if (!this.canContinue) {
				if (this.state.callStack.canPopThread)
					this.AddError("Thread available to pop, threads should always be flat by the end of evaluation?");

				if (this.state.generatedChoices.length == 0 && !this.state.didSafeExit && this._temporaryEvaluationContainer == null) {
					if (this.state.callStack.CanPop(PushPopType.Tunnel))
						this.AddError ("unexpectedly reached end of content. Do you need a '->->' to return from a tunnel?");
					else if (this.state.callStack.CanPop(PushPopType.Function))
						this.AddError ("unexpectedly reached end of content. Do you need a '~ return'?");
					else if (!this.state.callStack.canPop)
						this.AddError ("ran out of content. Do you need a '-> DONE' or '-> END'?");
					else
						this.AddError ("unexpectedly reached end of content for unknown reason. Please debug compiler!");
				}
			}

			this.state.didSafeExit = false;

			if (this._recursiveContinueCount == 1)
				this._state.variablesState.batchObservingVariableChanges = false;

			this._asyncContinueActive = false;
		}

		this._recursiveContinueCount--;

		if (this._profiler != null)
			this._profiler.PostContinue();
	}
	ContinueSingleStep(){
		if (this._profiler != null)
			this._profiler.PreStep();

		this.Step();

		if (this._profiler != null)
			this._profiler.PostStep();

		if (!this.canContinue && !this.state.callStack.elementIsEvaluateFromGame) {
			this.TryFollowDefaultInvisibleChoice();
		}

		if (this._profiler != null)
			this._profiler.PreSnapshot();

		if (!this.state.inStringEvaluation) {

			if (this._stateAtLastNewline != null) {

				var change = this.CalculateNewlineOutputStateChange (
					this._stateAtLastNewline.currentText, this.state.currentText,
					this._stateAtLastNewline.currentTags.length, this.state.currentTags.length
				);

				if (change == OutputStateChange.ExtendedBeyondNewline) {

					this.RestoreStateSnapshot(this._stateAtLastNewline);

					return true;
				}

				else if (change == OutputStateChange.NewlineRemoved) {
					this._stateAtLastNewline = null;
				}
			}

			if (this.state.outputStreamEndsInNewline) {
				if (this.canContinue) {
					if (this._stateAtLastNewline == null)
						this._stateAtLastNewline = this.StateSnapshot();
				}

				else {
					this._stateAtLastNewline = null;
				}
			}
		}

		if (this._profiler != null)
			this._profiler.PostSnapshot();

		return false;
	}
	CalculateNewlineOutputStateChange(prevText, currText, prevTagCount, currTagCount){
		var newlineStillExists = currText.length >= prevText.length && currText.charAt(prevText.length - 1) == '\n';
		if (prevTagCount == currTagCount && prevText.length == currText.length && newlineStillExists)
			return OutputStateChange.NoChange;

		if (!newlineStillExists) {
			return OutputStateChange.NewlineRemoved;
		}

		if (currTagCount > prevTagCount)
			return OutputStateChange.ExtendedBeyondNewline;

		for (var i = prevText.length; i < currText.length; i++) {
			var c = currText.charAt(i);
			if (c != ' ' && c != '\t') {
				return OutputStateChange.ExtendedBeyondNewline;
			}
		}

		return OutputStateChange.NoChange;
	}
	ContinueMaximally(){
		this.IfAsyncWeCant("ContinueMaximally");

		var sb = new StringBuilder();

		while (this.canContinue) {
			sb.Append(this.Continue());
		}

		return sb.toString();
	}
	ContentAtPath(path){
		return this.mainContentContainer.ContentAtPath(path);
	}
	KnotContainerWithName(name){
		var namedContainer = this.mainContentContainer.namedContent[name];
		if (namedContainer instanceof Container)
			return namedContainer;
		else
			return null;
	}
	PointerAtPath(path) {
		if (path.length == 0)
			return Pointer.Null;

		var p = new Pointer();

		var pathLengthToUse = path.length;

		var result = null;
		if (path.lastComponent.isIndex) {
			pathLengthToUse = path.length - 1;
			result = this.mainContentContainer.ContentAtPath(path, undefined, pathLengthToUse);
			p.container = result.container;
			p.index = path.lastComponent.index;
		} else {
			result = this.mainContentContainer.ContentAtPath(path);
			p.container = result.container;
			p.index = -1;
		}

		if (result.obj == null || result.obj == this.mainContentContainer && pathLengthToUse > 0)
			this.Error("Failed to find content at path '" + path + "', and no approximation of it was possible.");
		else if (result.approximate)
			this.Warning("Failed to find content at path '" + path + "', so it was approximated to: '"+result.obj.path+"'.");

		return p;
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
		var pointer = this.state.currentPointer.copy();
		if (pointer.isNull) {
			return;
		}
		// Step directly to the first element of content in a container (if necessary)
//		Container containerToEnter = pointer.Resolve () as Container;
		var containerToEnter = pointer.Resolve();

		while(containerToEnter instanceof Container) {

			// Mark container as being entered
			this.VisitContainer(containerToEnter, true);

			// No content? the most we can do is step past it
			if (containerToEnter.content.length == 0) {
				break;
			}

			pointer = Pointer.StartOf(containerToEnter);
//			containerToEnter = pointer.Resolve() as Container;
			containerToEnter = pointer.Resolve();
		}

		this.state.currentPointer = pointer.copy();

		if (this._profiler != null)
			this._profiler.Step(state.callStack);

		// Is the current content object:
		//  - Normal content
		//  - Or a logic/flow statement - if so, do it
		// Stop flow if we hit a stack pop when we're unable to pop (e.g. return/done statement in knot
		// that was diverted to rather than called as a function)
		var currentContentObj = pointer.Resolve();
		var isLogicOrFlowControl = this.PerformLogicAndFlowControl(currentContentObj);

		// Has flow been forced to end by flow control above?
		if (this.state.currentPointer.isNull) {
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
		var previousPointer = this.state.previousPointer.copy();
		var pointer = this.state.currentPointer.copy();

		if (pointer.isNull || pointer.index == -1)
			return;

		// First, find the previously open set of containers
		this._prevContainers.length = 0;
		if (!previousPointer.isNull) {
//			Container prevAncestor = previousPointer.Resolve() as Container ?? previousPointer.container as Container;
			var resolvedPreviousAncestor = previousPointer.Resolve();
			var prevAncestor = (resolvedPreviousAncestor instanceof Container) ? resolvedPreviousAncestor : previousPointer.container;
			while (prevAncestor instanceof Container) {
				this._prevContainers.push(prevAncestor);
//				prevAncestor = prevAncestor.parent as Container;
				prevAncestor = prevAncestor.parent;
			}
		}

		// If the new object is a container itself, it will be visited automatically at the next actual
		// content step. However, we need to walk up the new ancestry to see if there are more new containers
		var currentChildOfContainer = pointer.Resolve();

		if (currentChildOfContainer == null) return;

//		Container currentContainerAncestor = currentChildOfContainer.parent as Container;
		var currentContainerAncestor = currentChildOfContainer.parent;
		while (currentContainerAncestor instanceof Container && this._prevContainers.indexOf(currentContainerAncestor) < 0) {

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

		// We go through the full process of creating the choice above so
		// that we consume the content for it, since otherwise it'll
		// be shown on the output stream.
		if (!showChoice) {
			return null;
		}

		var choice = new Choice();
		choice.targetPath = choicePoint.pathOnChoice;
		choice.sourcePath = choicePoint.path.toString();
		choice.isInvisibleDefault = choicePoint.isInvisibleDefault;
		choice.threadAtGeneration = this.state.callStack.currentThread.Copy();

		choice.text = (startText + choiceOnlyText).replace(/^[ \t]+|[ \t]+$/g, '');

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

				if (varContents == null) {
					this.Error("Tried to divert using a target from a variable that could not be found (" + varName + ")");
				}
				else if (!(varContents instanceof DivertTargetValue)) {

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
				this.state.divertedPointer = this.PointerAtPath(target.targetPath);

			} else if (currentDivert.isExternal) {
				this.CallExternalFunction(currentDivert.targetPathString, currentDivert.externalArgs);
				return true;
			} else {
				this.state.divertedPointer = currentDivert.targetPointer.copy();
			}

			if (currentDivert.pushesToStack) {
				this.state.callStack.Push(
					currentDivert.stackPushType,
					undefined,
					this.state.outputStream.length
				);
			}

			if (this.state.divertedPointer.isNull && !currentDivert.isExternal) {

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

				if (this.state.TryExitFunctionEvaluationFromGame()){
					break;
				}
				else if (this.state.callStack.currentElement.type != popType || !this.state.callStack.canPop) {

					var names = {};
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
					this.state.PopCallStack();

					if (overrideTunnelReturnTarget)
						this.state.divertedPointer = this.PointerAtPath(overrideTunnelReturnTarget.targetPath);
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

					if( obj instanceof StringValue ) {
						contentStackForString.push(obj);
					}
				}

				// Consume the content that was produced for this string
				this.state.PopFromOutputStream(outputCountConsumed);

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
//				var container = ContentAtPath (divertTarget.targetPath).correctObj as Container;
				var correctObj = this.ContentAtPath(divertTarget.targetPath).correctObj;
				var container = (correctObj instanceof Container) ? correctObj : null;

				var eitherCount;
				if (container != null) {
					if (evalCommand.commandType == ControlCommand.CommandType.TurnsSince)
						eitherCount = this.TurnsSinceForContainer(container);
					else
						eitherCount = this.VisitCountForContainer(container);
				} else {
					if (evalCommand.commandType == ControlCommand.CommandType.TurnsSince)
						eitherCount = -1;
					else
						eitherCount = 0;

					this.Warning("Failed to find container for " + evalCommand.toString() + " lookup at " + divertTarget.targetPath.toString());
				}

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
				var count = this.VisitCountForContainer(this.state.currentPointer.container) - 1; // index not count
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
					this.state.currentPointer = Pointer.Null;
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

				if (intVal == null) {
				throw new StoryException("Passed non-integer when creating a list element from a numerical value.");
				}

				var generatedListValue = null;

				var foundListDef;
				if (foundListDef = this.listDefinitions.TryListGetDefinition(listNameVal, foundListDef)) {
					var foundItem = foundListDef.TryGetItemWithValue(intVal);
					if (foundItem.exists) {
						generatedListValue = new ListValue(foundItem.item, intVal);
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
					var defaultVal = this.state.variablesState.TryGetDefaultVariableValue (varRef.name);
					if (defaultVal != null) {
						this.Warning("Variable not found in save state: '" + varRef.name + "', but seems to have been newly created. Assigning value from latest ink's declaration: " + defaultVal);
						foundValue = defaultVal;

						// Save for future usage, preventing future errors
						// Only do this for variables that are known to be globals, not those that may be missing temps.
						state.variablesState.SetGlobal(varRef.name, foundValue);
					} else {
						this.Warning ("Variable not found: '" + varRef.name + "'. Using default value of 0 (false). This can happen with temporary variables if the declaration hasn't yet been hit.");
						foundValue = new IntValue(0);
					}
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
	ChoosePathString(path, resetCallstack, args){
		resetCallstack = (typeof resetCallstack !== 'undefined') ? resetCallstack : true;
		args = args || [];

		this.IfAsyncWeCant ("call ChoosePathString right now");

		if (resetCallstack) {
			this.ResetCallstack();
		} else {
			if (this.state.callStack.currentElement.type == PushPopType.Function) {
				var funcDetail = "";
				var container = this.state.callStack.currentElement.currentPointer.container;
				if (container != null) {
					funcDetail = "("+container.path.toString ()+") ";
				}
				throw "Story was running a function "+funcDetail+"when you called ChoosePathString("+path+") - this is almost certainly not not what you want! Full stack trace: \n"+this.state.callStack.callStackTrace;
			}
		}

		this.state.PassArgumentsToEvaluationStack(args);
		this.ChoosePath(new Path(path));
	}

	IfAsyncWeCant (activityStr)
	{
		if (this._asyncContinueActive)
			throw "Can't " + activityStr + ". Story is in the middle of a ContinueAsync(). Make more ContinueAsync() calls or a single Continue() call beforehand.";
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

		this.ChoosePath(choiceToChoose.targetPath);
	}
	HasFunction(functionName){
		try {
			return this.KnotContainerWithName(functionName) != null;
		} catch(e) {
			return false;
		}
	}
	EvaluateFunction(functionName, args, returnTextOutput){
		//EvaluateFunction behaves slightly differently than the C# version. In C#, you can pass a (second) parameter `out textOutput` to get the text outputted by the function. This is not possible in js. Instead, we maintain the regular signature (functionName, args), plus an optional third parameter returnTextOutput. If set to true, we will return both the textOutput and the returned value, as an object.
		returnTextOutput = !!returnTextOutput;

		this.IfAsyncWeCant("evaluate a function");

		if (functionName == null) {
			throw "Function is null";
		}
		else if (functionName == '' || functionName.trim() == '') {
			throw "Function is empty or white space.";
		}

		var funcContainer = this.KnotContainerWithName(functionName);
		if (funcContainer == null) {
			throw "Function doesn't exist: '" + functionName + "'";
		}

		var outputStreamBefore = [];
		outputStreamBefore.push.apply(outputStreamBefore, this.state.outputStream);
		this._state.ResetOutput();

		this.state.StartFunctionEvaluationFromGame(funcContainer, args);

		// Evaluate the function, and collect the string output
		var stringOutput = new StringBuilder();
		while (this.canContinue) {
			stringOutput.Append(this.Continue());
		}
		var textOutput = stringOutput.toString();

		this._state.ResetOutput(outputStreamBefore);

		var result = this.state.CompleteFunctionEvaluationFromGame();

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
			this.state.PopCallStack();
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
				fallbackFunctionContainer = this.KnotContainerWithName(funcName);
				if (!(fallbackFunctionContainer instanceof Container)) console.warn("Trying to call EXTERNAL function '" + funcName + "' which has not been bound, and fallback ink function could not be found.");

				// Divert direct into fallback function and we're done
				this.state.callStack.Push(
					PushPopType.Function,
					undefined,
					this.state.outputStream.length
				);
				this.state.divertedPointer = Pointer.StartOf(fallbackFunctionContainer);
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
		this.IfAsyncWeCant("bind an external function");
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
		this.IfAsyncWeCant("unbind an external a function");
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
				if( !(innerContent instanceof Container) || !innerContent.hasValidName ) {
					this.ValidateExternalBindings(innerContent, missingExternals);
				}
			});
			for (var key in c.namedContent){
				this.ValidateExternalBindings(c.namedContent[key], missingExternals);
			}
		}
		else{
			var o = containerOrObject;
			// the following code is already taken care of above in this implementation
			//
			// var container = o as Container;
			// if (container) {
			// 	ValidateExternalBindings (container, missingExternals);
			// 	return;
			// }

			// var divert = o as Divert;
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
		this.IfAsyncWeCant("observe a new variable");

		if (this._variableObservers == null)
			this._variableObservers = {};

		if(!this.state.variablesState.GlobalVariableExistsWithName(variableName))
			throw new StoryException("Cannot observe variable '"+variableName+"' because it wasn't declared in the ink story.");

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
		this.IfAsyncWeCant("remove a variable observer");

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
		var flowContainer = this.ContentAtPath(path).container;
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

		this.mainContentContainer.BuildStringOfHierarchy(sb, 0, this.state.currentPointer.Resolve());

    return sb.toString();
	}
	BuildStringOfContainer(container){
		var sb = new StringBuilder();
		container.BuildStringOfHierarchy(sb, 0, this.state.currentPointer.Resolve());
		return sb.toString();
	}
	NextContent(){
		// Setting previousContentObject is critical for VisitChangedContainersDueToDivert
		this.state.previousPointer = this.state.currentPointer.copy();

		// Divert step?
		if (!this.state.divertedPointer.isNull) {

			this.state.currentPointer = this.state.divertedPointer.copy();
			this.state.divertedPointer = Pointer.Null;

			// Internally uses state.previousContentObject and state.currentContentObject
			this.VisitChangedContainersDueToDivert();

			// Diverted location has valid content?
			if (!this.state.currentPointer.isNull) {
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
				this.state.PopCallStack(PushPopType.Function);

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
				this.state.TryExitFunctionEvaluationFromGame();
			}

			// Step past the point where we last called out
			if (didPop && !this.state.currentPointer.isNull) {
				this.NextContent();
			}
		}
	}
	IncrementContentPointer(){
		var successfulIncrement = true;

		var pointer = this.state.callStack.currentElement.currentPointer.copy();
		pointer.index++;

		// Each time we step off the end, we fall out to the next container, all the
		// while we're in indexed rather than named content
		while (pointer.index >= pointer.container.content.length) {

			successfulIncrement = false;

//			Container nextAncestor = pointer.container.parent as Container;
			var nextAncestor = pointer.container.parent;
			if (nextAncestor instanceof Container === false) {
				break;
			}

			var indexInAncestor = nextAncestor.content.indexOf(pointer.container);
			if (indexInAncestor == -1) {
				break;
			}

			pointer = new Pointer(nextAncestor, indexInAncestor)

			pointer.index++;

			successfulIncrement = true;
		}

		if (!successfulIncrement) pointer = Pointer.Null;

		this.state.callStack.currentElement.currentPointer = pointer.copy();

		return successfulIncrement;
	}
	TryFollowDefaultInvisibleChoice(){
		var allChoices = this._state.currentChoices;

		// Is a default invisible choice the ONLY choice?
		var invisibleChoices = allChoices.filter(c => {
			return c.isInvisibleDefault;
		});
		if (invisibleChoices.length == 0 || allChoices.length > invisibleChoices.length)
			return false;

		var choice = invisibleChoices[0];

		this.ChoosePath(choice.targetPath);

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

		var seqContainer = this.state.currentPointer.container;

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
			sequenceHash += seqPathStr.charCodeAt(i) || 0;
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
	Warning(message){
		this.AddError(message, true);
	}
	AddError(message, isWarning, useEndLineNumber){
//		var dm = this.currentDebugMetadata;
		var dm = null;

		var errorTypeStr = isWarning ? "WARNING" : "ERROR";

		if (dm != null) {
			var lineNum = useEndLineNumber ? dm.endLineNumber : dm.startLineNumber;
			message = "RUNTIME " + errorTypeStr + ": '" + dm.fileName + "' line " + lineNum + ": " + message;
		}
		else if(!this.state.currentPointer.isNull) {
			message = "RUNTIME " + errorTypeStr + ": (" + this.state.currentPath + "): " + message;
		}
		else {
			message = "RUNTIME " + errorTypeStr + ": " + message;
		}

		this.state.AddError(message, isWarning);

		// In a broken state don't need to know about any other errors.
		if (!isWarning)
			this.state.ForceEnd();
	}
}

var OutputStateChange = {
	NoChange: 0,
	ExtendedBeyondNewline: 1,
	NewlineRemoved: 2
}
