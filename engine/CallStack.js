import {PushPopType} from './PushPopType';

class Element{
	constructor(type, container, contentIndex, inExpressionEvaluation){
		this.currentContainer = container;
		this.currentContentIndex = contentIndex;
		this.inExpressionEvaluation = inExpressionEvaluation;
		this.temporaryVariables = {};
		this.type = type;
	}
}

class Thread{
	constructor(){
		this._callstack = [];
	}
	callstack(){
		return this._callstack;
	}
}

export class CallStack{
	constructor(rootContentContainer){
		this._threads = [];
		this._threads.Add(new Thread());
		
        this._threads[0].callstack.push(new Element(PushPopType.Tunnel, rootContentContainer, 0));
	}
}