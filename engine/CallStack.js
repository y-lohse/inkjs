//complete
import {PushPopType} from './PushPop';
import {Container} from './Container';
import {Path} from './Path';
import {StoryException} from './StoryException';
import {JsonSerialisation as Json} from './JsonSerialisation';

class Element{
	constructor(type, container, contentIndex, inExpressionEvaluation){
		this.currentContainer = container;
		this.currentContentIndex = contentIndex;
		this.inExpressionEvaluation = inExpressionEvaluation || false;
		this.temporaryVariables = {};
		this.type = type;
	}
	get currentObject(){
		if (this.currentContainer && this.currentContentIndex < this.currentContainer.content.length) {
			return this.currentContainer.content[this.currentContentIndex];
		}

		return null;
	}
	set currentObject(value){
		var currentObj = value;
		if (currentObj == null) {
			this.currentContainer = null;
			this.currentContentIndex = 0;
			return;
		}

//		currentContainer = currentObj.parent as Container;
		this.currentContainer = currentObj.parent;
		if (this.currentContainer instanceof Container)
			this.currentContentIndex = this.currentContainer.content.indexOf(currentObj);

		// Two reasons why the above operation might not work:
		//  - currentObj is already the root container
		//  - currentObj is a named container rather than being an object at an index
		if (this.currentContainer instanceof Container === false || this.currentContentIndex == -1) {
//			currentContainer = currentObj as Container;
			this.currentContainer = currentObj;
			this.currentContentIndex = 0;
		}
	}
	Copy(){
		var copy = new Element(this.type, this.currentContainer, this.currentContentIndex, this.inExpressionEvaluation);
		Object.assign(copy.temporaryVariables, this.temporaryVariables);
		return copy;
	}
}

class Thread{
	constructor(jsonToken, storyContext){
		this.callstack = [];
		this.threadIndex = 0;
		this.previousContentObject = null;
		
		if (jsonToken && storyContext){
			var jThreadObj = jsonToken;
			this.threadIndex = parseInt(jThreadObj["threadIndex"]);

			var jThreadCallstack = jThreadObj["callstack"];
			
			jThreadCallstack.forEach(jElTok => {
				var jElementObj = jElTok;

				var pushPopType = parseInt(jElementObj["type"]);

				var currentContainer = null;
				var contentIndex = 0;

				var currentContainerPathStr = null;
				var currentContainerPathStrToken = jElementObj["cPath"];
				if (typeof currentContainerPathStrToken !== 'undefined') {
					currentContainerPathStr = currentContainerPathStrToken.toString();
//					currentContainer = storyContext.ContentAtPath (new Path(currentContainerPathStr)) as Container;
					currentContainer = storyContext.ContentAtPath(new Path(currentContainerPathStr));
					contentIndex = parseInt(jElementObj["idx"]);
				}

				var inExpressionEvaluation = !!jElementObj["exp"];

				var el = new Element(pushPopType, currentContainer, contentIndex, inExpressionEvaluation);

				var jObjTemps = jElementObj["temp"];
				el.temporaryVariables = Json.JObjectToDictionaryRuntimeObjs(jObjTemps);

				this.callstack.push(el);
			});
			
			var prevContentObjPath = jThreadObj["previousContentObject"];
			if(typeof prevContentObjPath  !== 'undefined') {
				var prevPath = new Path(prevContentObjPath.toString());
				this.previousContentObject = storyContext.ContentAtPath(prevPath);
			}
		}
	}
	get jsonToken(){
		var threadJObj = {};

		var jThreadCallstack = [];
		this.callstack.forEach(el => {
			var jObj = {};
			if (el.currentContainer) {
				jObj["cPath"] = el.currentContainer.path.componentsString;
				jObj["idx"] = el.currentContentIndex;
			}
			jObj["exp"] = el.inExpressionEvaluation;
			jObj["type"] = parseInt(el.type);
			jObj["temp"] = Json.DictionaryRuntimeObjsToJObject(el.temporaryVariables);
			jThreadCallstack.push(jObj);
		});

		threadJObj["callstack"] = jThreadCallstack;
		threadJObj["threadIndex"] = this.threadIndex;
		
		if (this.previousContentObject != null)
			threadJObj["previousContentObject"] = this.previousContentObject.path.toString();

		return threadJObj;
	}
	Copy(){
		var copy = new Thread();
		copy.threadIndex = this.threadIndex;
		this.callstack.forEach(e => {
			copy.callstack.push(e.Copy());
		});
		copy.previousContentObject = this.previousContentObject;
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
        	this._threads[0].callstack.push(new Element(PushPopType.Tunnel, copyOrrootContentContainer, 0));
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
	get elements(){
		return this.callStack;
	}
	get currentElement(){
		return this.callStack[this.callStack.length - 1];
	}
	get currentElementIndex(){
		return this.callStack.length - 1;
	}
	get canPop(){
		return this.callStack.length > 1;
	}
	get canPopThread(){
		return this._threads.length > 1;
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
			console.error("Mismatched push/pop in Callstack");
		}
	}
	Push(type){
		// When pushing to callstack, maintain the current content path, but jump out of expressions by default
		this.callStack.push(new Element(type, this.currentElement.currentContainer, this.currentElement.currentContentIndex, false));
	}
	PushThread(){
		var newThread = this.currentThread.Copy();
		newThread.threadIndex = this._threadCounter;
		this._threadCounter++;
		this._threads.push(newThread);
	}
	PopThread(){
		if (this.canPopThread) {
			this._threads.splice(this.currentThread, 1);//should be equivalent to a pop()
		} else {
			console.error("Can't pop thread");
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
			contextIndex = this.currentElementIndex;
		
		var varValue = null;

		var contextElement = this.callStack[contextIndex];

		if (varValue = contextElement.temporaryVariables[name]) {
			return varValue;
		} else {
			return null;
		}
	}
	SetTemporaryVariable(name, value, declareNew, contextIndex){
		contextIndex = (typeof contextIndex === 'undefined') ? -1 : contextIndex;
		
		if (contextIndex == -1) 
			contextIndex = this.currentElementIndex;

		var contextElement = this.callStack[contextIndex];

		if (!declareNew && !contextElement.temporaryVariables[name]) {
			throw new StoryException("Could not find temporary variable to set: " + name);
		}

		contextElement.temporaryVariables[name] = value;
	}
	ContextForVariableNamed(name){
		// Current temporary context?
		// (Shouldn't attempt to access contexts higher in the callstack.)
		if (this.currentElement.temporaryVariables[name]) {
			return this.currentElementIndex;
		} 

		// Global
		else {
			return -1;
		}
	}
	ThreadWithIndex(index){
		var filtered = this._threads.filter(t => {
			if (t.threadIndex == index) return t;
		});
		
		return filtered[0];
	}
}