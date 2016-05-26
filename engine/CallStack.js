import {PushPopType} from './PushPop';

class Element{
	constructor(type, container, contentIndex, inExpressionEvaluation){
		this.currentContainer = container;
		this.currentContentIndex = contentIndex;
		this.inExpressionEvaluation = inExpressionEvaluation;
		this.temporaryVariables = {};
		this.type = type;
	}
	get currentObject(){
		if (this.currentContainer && this.currentContentIndex < this.currentContainer.content.length) {
			return this.currentContainer.content[this.currentContentIndex];
		}

		return null;
	}
}

class Thread{
	constructor(){
		this._callstack = [];
		this.threadIndex = 0;
	}
	get callstack(){
		return this._callstack;
	}
}

export class CallStack{
	constructor(rootContentContainer){
		this._threads = [];
		this._threads.push(new Thread());
		
        this._threads[0].callstack.push(new Element(PushPopType.Tunnel, rootContentContainer, 0));
	}
	get currentThread(){
		return this._threads[this._threads.length - 1];
	}
	get callStack(){
		return this.currentThread.callstack;
	}
	get currentElement(){
		return this.callStack[this.callStack.length - 1];
	}
	get currentElementIndex(){
		return this.callStack.length - 1;
	}
}