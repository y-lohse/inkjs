import {PushPopType} from './PushPop';
import {Container} from './Container';

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
	get canPop(){
		return this.callStack.length > 1;
	}
	
	CanPop(type){
		if (!this.canPop)
			return false;

		if (type == null)
			return true;

		return this.currentElement.type == type;
	}
	GetTemporaryVariableWithName(name, contextIndex){
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
	Push(type){
		// When pushing to callstack, maintain the current content path, but jump out of expressions by default
		this.callStack.push(new Element(type, this.currentElement.currentContainer, this.currentElement.currentContentIndex, false));
	}
}