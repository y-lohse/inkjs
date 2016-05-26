import {Object as InkObject} from './Object';
import {Container} from './Container';
import {JsonSerialisation} from './JsonSerialisation';
import {StoryState} from './StoryState';

export class Story extends InkObject{
	constructor(jsonString){
		super();
		
		this._hasValidatedExternals = true;//@TODO init to false
		
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

		//_previousContainer = null;

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

//			do {

				// Run main step function (walks through content)
				this.Step();

				// Run out of content and we have a default invisible choice that we can follow?
//				if( !canContinue ) {
//					TryFollowDefaultInvisibleChoice();
//				}
//
//				// Don't save/rewind during string evaluation, which is e.g. used for choices
//				if( !state.inStringEvaluation ) {
//
//					// We previously found a newline, but were we just double checking that
//					// it wouldn't immediately be removed by glue?
//					if( stateAtLastNewline != null ) {
//
//						// Cover cases that non-text generated content was evaluated last step
//						string currText = currentText;
//						int prevTextLength = stateAtLastNewline.currentText.Length;
//
//						// Output has been extended?
//						if( !currText.Equals(stateAtLastNewline.currentText) ) {
//
//							// Original newline still exists?
//							if( currText.Length >= prevTextLength && currText[prevTextLength-1] == '\n' ) {
//
//								RestoreStateSnapshot(stateAtLastNewline);
//								break;
//							}
//
//							// Newline that previously existed is no longer valid - e.g.
//							// glue was encounted that caused it to be removed.
//							else {
//								stateAtLastNewline = null;
//							}
//						}
//
//					}
//
//					// Current content ends in a newline - approaching end of our evaluation
//					if( state.outputStreamEndsInNewline ) {
//
//						// If we can continue evaluation for a bit:
//						// Create a snapshot in case we need to rewind.
//						// We're going to continue stepping in case we see glue or some
//						// non-text content such as choices.
//						if( canContinue ) {
//							stateAtLastNewline = StateSnapshot();
//						} 
//
//						// Can't continue, so we're about to exit - make sure we
//						// don't have an old state hanging around.
//						else {
//							stateAtLastNewline = null;
//						}
//
//					}
//
//				}

//			} while(this.canContinue);

			// Need to rewind, due to evaluating further than we should?
//			if( stateAtLastNewline != null ) {
//				RestoreStateSnapshot(stateAtLastNewline);
//			}

			// Finished a section of content / reached a choice point?
//			if( !canContinue ) {
//
//				if( state.callStack.canPopThread ) {
//					Error("Thread available to pop, threads should always be flat by the end of evaluation?");
//				}
//
//				if( currentChoices.Count == 0 && !state.didSafeExit ) {
//					if( state.callStack.CanPop(PushPopType.Tunnel) ) {
//						Error("unexpectedly reached end of content. Do you need a '->->' to return from a tunnel?");
//					} else if( state.callStack.CanPop(PushPopType.Function) ) {
//						Error("unexpectedly reached end of content. Do you need a '~ return'?");
//					} else if( !state.callStack.canPop ) {
//						Error("ran out of content. Do you need a '-> DONE' or '-> END'?");
//					} else {
//						Error("unexpectedly reached end of content for unknown reason. Please debug compiler!");
//					}
//				}
//
//			}


		} catch(e) {
//			this.AddError(e.Message, e.useEndLineNumber);
			throw e;
		} finally {
			this.state.didSafeExit = false;
			
			this._state.variablesState.batchObservingVariableChanges = false;
		}

		return this.currentText;
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
//		bool isLogicOrFlowControl = PerformLogicAndFlowControl (currentContentObj);
		var isLogicOrFlowControl = false;

		// Has flow been forced to end by flow control above?
		if (this.state.currentContentObject == null) {
			return;
		}

		if (isLogicOrFlowControl) {
			shouldAddToStream = false;
		}

		// Choice with condition?
//		var choicePoint = currentContentObj as ChoicePoint;
//		if (choicePoint) {
//			var choice = ProcessChoice (choicePoint);
//			if (choice) {
//				state.currentChoices.Add (choice);
//			}
//
//			currentContentObj = null;
//			shouldAddToStream = false;
//		}

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
//			if (varPointer && varPointer.contextIndex == -1) {
//
//				// Create new object so we're not overwriting the story's own data
//				var contextIdx = state.callStack.ContextForVariableNamed(varPointer.variableName);
//				currentContentObj = new VariablePointerValue (varPointer.variableName, contextIdx);
//			}

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
//		if (controlCmd && controlCmd.commandType == ControlCommand.CommandType.StartThread) {
//			state.callStack.PushThread ();
//		}
	}
	VisitContainer(container, atStart){
		if (!container.countingAtStartOnly || atStart) {
			if (container.visitsShouldBeCounted)
				this.IncrementVisitCountForContainer(container);

			if (container.turnIndexShouldBeCounted)
				this.RecordTurnIndexVisitToContainer(container);
		}
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
				this.state.callStack.pop(PushPopType.Function);

				// This pop was due to dropping off the end of a function that didn't return anything,
				// so in this case, we make sure that the evaluator has something to chomp on if it needs it
				if (this.state.inExpressionEvaluation) {
					this.state.PushEvaluationStack({});
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
}