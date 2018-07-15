import {PushPopType} from './PushPop';
import {Path} from './Path';
import {StoryException} from './StoryException';
import {JsonSerialisation} from './JsonSerialisation';
import {ListValue} from './Value';
import {StringBuilder} from './StringBuilder';
import {Pointer} from './Pointer';

class Element{
	constructor(type, pointer, inExpressionEvaluation){
		this.currentPointer = pointer.copy();

		this.inExpressionEvaluation = inExpressionEvaluation || false;
		this.temporaryVariables = {};
		this.type = type;

		this.evaluationStackHeightWhenPushed = 0;
		this.functionStartInOuputStream = 0;
	}

	Copy(){
		var copy = new Element(this.type, this.currentPointer, this.inExpressionEvaluation);
		Object.assign(copy.temporaryVariables, this.temporaryVariables);
		copy.evaluationStackHeightWhenPushed = this.evaluationStackHeightWhenPushed;
		copy.functionStartInOuputStream = this.functionStartInOuputStream;
		return copy;
	}
}

class Thread{
	constructor(jsonToken, storyContext){
		this.callstack = [];
		this.threadIndex = 0;
		this.previousPointer = Pointer.Null;

		if (jsonToken && storyContext){
			var jThreadObj = jsonToken;
			this.threadIndex = parseInt(jThreadObj["threadIndex"]);

			var jThreadCallstack = jThreadObj["callstack"];

			jThreadCallstack.forEach(jElTok => {
				var jElementObj = jElTok;

				var pushPopType = parseInt(jElementObj["type"]);

				var pointer = Pointer.Null;

				var currentContainerPathStr = null;
				var currentContainerPathStrToken = jElementObj["cPath"];
				if (typeof currentContainerPathStrToken !== 'undefined') {
					currentContainerPathStr = currentContainerPathStrToken.toString();

					var threadPointerResult = storyContext.ContentAtPath(new Path(currentContainerPathStr));
					pointer.container = threadPointerResult.container;
					pointer.index = parseInt(jElementObj["idx"]);

					if (threadPointerResult.obj == null)
						throw "When loading state, internal story location couldn't be found: " + currentContainerPathStr + ". Has the story changed since this save data was created?";
					else if (threadPointerResult.approximate)
						storyContext.Warning("When loading state, exact internal story location couldn't be found: '" + currentContainerPathStr + "', so it was approximated to '"+pointer.container.path.toString()+"' to recover. Has the story changed since this save data was created?");
				}

				var inExpressionEvaluation = !!jElementObj["exp"];

				var el = new Element(pushPopType, pointer, inExpressionEvaluation);

				var jObjTemps = jElementObj["temp"];
				el.temporaryVariables = JsonSerialisation.JObjectToDictionaryRuntimeObjs(jObjTemps);

				this.callstack.push(el);
			});

			var prevContentObjPath = jThreadObj["previousContentObject"];
			if(typeof prevContentObjPath !== 'undefined') {
				var prevPath = new Path(prevContentObjPath.toString());
				this.previousPointer = storyContext.PointerAtPath(prevPath);
			}
		}
	}

	get jsonToken(){
		var threadJObj = {};

		var jThreadCallstack = [];
		this.callstack.forEach(el => {
			var jObj = {};
			if (!el.currentPointer.isNull) {
				jObj["cPath"] = el.currentPointer.container.path.componentsString;
				jObj["idx"] = el.currentPointer.index;
			}
			jObj["exp"] = el.inExpressionEvaluation;
			jObj["type"] = parseInt(el.type);
			jObj["temp"] = JsonSerialisation.DictionaryRuntimeObjsToJObject(el.temporaryVariables);
			jThreadCallstack.push(jObj);
		});

		threadJObj["callstack"] = jThreadCallstack;
		threadJObj["threadIndex"] = this.threadIndex;

		if (!this.previousPointer.isNull)
			threadJObj["previousContentObject"] = this.previousPointer.Resolve().path.toString();

		return threadJObj;
	}

	Copy(){
		var copy = new Thread();
		copy.threadIndex = this.threadIndex;
		this.callstack.forEach(e => {
			copy.callstack.push(e.Copy());
		});
		copy.previousPointer = this.previousPointer.copy();
		return copy;
	}
}

export class CallStack{
	constructor(copyOrrootContentContainer){
		this._threads = [];
		this._threadCounter = 0;
		this._threads.push(new Thread());

		if (copyOrrootContentContainer instanceof CallStack){
			this._threads = [];

			copyOrrootContentContainer._threads.forEach(otherThread => {
				this._threads.push(otherThread.Copy());
			});
		}
		else{
			this._threads[0].callstack.push(new Element(PushPopType.Tunnel, Pointer.StartOf(copyOrrootContentContainer)));
		}
	}
	get currentThread(){
		return this._threads[this._threads.length - 1];
	}
	set currentThread(value){
		if (this._threads.length != 1) console.warn("Shouldn't be directly setting the current thread when we have a stack of them");

		this._threads.length = 0;
		this._threads.push(value);
	}
	get callStack(){
		return this.currentThread.callstack;
	}
	get callStackTrace(){
		var sb = new StringBuilder();

		for (var t = 0; t < this._threads.length; t++) {
			var thread = this._threads[t];
			var isCurrent = (t == this._threads.length - 1);
			sb.AppendFormat("=== THREAD {0}/{1} {2}===\n", (t+1), this._threads.length, (isCurrent ? "(current) ":""));

			for (var i = 0; i < thread.callstack.length; i++) {

				if (thread.callstack[i].type == PushPopType.Function)
					sb.Append("  [FUNCTION] ");
				else
					sb.Append("  [TUNNEL] ");

				var pointer = thread.callstack[i].currentPointer;
				if(!pointer.isNull) {
					sb.Append("<SOMEWHERE IN ");
					sb.Append(pointer.container.path.toString());
					sb.AppendLine(">");
				}
			}
		}

		return sb.toString();
	}
	get elements(){
		return this.callStack;
	}
	get depth(){
		return this.elements.length;
	}
	get currentElement(){
		var thread = this._threads[this._threads.length - 1];
		var cs = thread.callstack;
		return cs[cs.length - 1];
	}
	get currentElementIndex(){
		return this.callStack.length - 1;
	}
	get canPop(){
		return this.callStack.length > 1;
	}
	get canPopThread(){
		return this._threads.length > 1 && !this.elementIsEvaluateFromGame;
	}
	get elementIsEvaluateFromGame(){
		return this.currentElement.type == PushPopType.FunctionEvaluationFromGame;
	}

	CanPop(type){
		if (!this.canPop)
			return false;

		if (type == null)
			return true;

		return this.currentElement.type == type;
	}
	Pop(type){
		if (this.CanPop(type)) {
			this.callStack.pop();
			return;
		} else {
			throw "Mismatched push/pop in Callstack";
		}
	}
	Push(type, externalEvaluationStackHeight, outputStreamLengthWithPushed){
		externalEvaluationStackHeight = (typeof externalEvaluationStackHeight !== 'undefined') ? externalEvaluationStackHeight : 0;
		outputStreamLengthWithPushed = (typeof outputStreamLengthWithPushed !== 'undefined') ? outputStreamLengthWithPushed : 0;

		var element = new Element (
			type,
			this.currentElement.currentPointer,
			false
		)

		element.evaluationStackHeightWhenPushed = externalEvaluationStackHeight;
		element.functionStartInOuputStream = outputStreamLengthWithPushed;

		this.callStack.push (element);
	}
	PushThread(){
		var newThread = this.currentThread.Copy();
		this._threadCounter++;
		newThread.threadIndex = this._threadCounter;
		this._threads.push(newThread);
	}
	PopThread(){
		if (this.canPopThread) {
			this._threads.splice(this._threads.indexOf(this.currentThread), 1);//should be equivalent to a pop()
		} else {
			throw "Can't pop thread";
		}
	}
	SetJsonToken(token, storyContext){
		this._threads.length = 0;

		var jObject = token;

		var jThreads = jObject["threads"];

		jThreads.forEach(jThreadTok => {
			var thread = new Thread(jThreadTok, storyContext);
			this._threads.push(thread);
		});

		this._threadCounter = parseInt(jObject["threadCounter"]);
	}
	GetJsonToken(){
		var jObject = {};

		var jThreads = [];
		this._threads.forEach(thread => {
			jThreads.push(thread.jsonToken);
		});

		jObject["threads"] = jThreads;
		jObject["threadCounter"] = this._threadCounter;

		return jObject;
	}
	GetTemporaryVariableWithName(name, contextIndex){
		contextIndex = (typeof contextIndex === 'undefined') ? -1 : contextIndex;

		if (contextIndex == -1)
			contextIndex = this.currentElementIndex + 1;

		var varValue = null;

		var contextElement = this.callStack[contextIndex - 1];

		if (varValue = contextElement.temporaryVariables[name]) {
			return varValue;
		} else {
			return null;
		}
	}
	SetTemporaryVariable(name, value, declareNew, contextIndex){
		contextIndex = (typeof contextIndex === 'undefined') ? -1 : contextIndex;

		if (contextIndex == -1)
			contextIndex = this.currentElementIndex + 1;

		var contextElement = this.callStack[contextIndex - 1];

		if (!declareNew && !contextElement.temporaryVariables[name]) {
			throw new StoryException("Could not find temporary variable to set: " + name);
		}

		var oldValue;
		if( oldValue = contextElement.temporaryVariables[name] )
			ListValue.RetainListOriginsForAssignment(oldValue, value);

		contextElement.temporaryVariables[name] = value;
	}
	ContextForVariableNamed(name){
		// Current temporary context?
		// (Shouldn't attempt to access contexts higher in the callstack.)
		if (this.currentElement.temporaryVariables[name]) {
			return this.currentElementIndex + 1;
		}

		// Global
		else {
			return 0;
		}
	}
	ThreadWithIndex(index){
		var filtered = this._threads.filter(t => {
			if (t.threadIndex == index) return t;
		});

		return filtered[0];
	}
}
