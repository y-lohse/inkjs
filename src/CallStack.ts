import {PushPopType} from './PushPop';
import {Path} from './Path';
import {StoryException} from './StoryException';
import {JsonSerialisation} from './JsonSerialisation';
import {ListValue} from './Value';
import {StringBuilder} from './StringBuilder';
import {Pointer} from './Pointer';
import {InkObject} from './Object';
import {Container} from './Container';
import {Debug} from './Debug';
import {tryGetValueFromMap} from './TryGetResult';
import {throwNullException} from './NullException';

export class CallStack{
	get elements(){
		return this.callStack;
	}

	get depth(){
		return this.elements.length;
	}

	get currentElement(){
		let thread = this._threads[this._threads.length - 1];
		let cs = thread.callstack;
		return cs[cs.length - 1];
	}

	get currentElementIndex(){
		return this.callStack.length - 1;
	}

	get currentThread(): CallStack.Thread {
		return this._threads[this._threads.length - 1];
	}
	set currentThread(value: CallStack.Thread){
		Debug.Assert(this._threads.length == 1, "Shouldn't be directly setting the current thread when we have a stack of them");

		this._threads.length = 0;
		this._threads.push(value);
	}

	get canPop(){
		return this.callStack.length > 1;
	}

	// tslint:disable:unified-signatures
	constructor(rootContentContainer: Container | null)
	constructor(toCopy: CallStack)
	constructor(){
		if (arguments[0] instanceof Container || arguments[0] === null) {
			let rootContentContainer = arguments[0] as Container | null;

			this._threads = [];
			this._threads.push(new CallStack.Thread());

			this._threads[0].callstack.push(new CallStack.Element(PushPopType.Tunnel, Pointer.StartOf(rootContentContainer)));
		} else {
			let toCopy = arguments[0] as CallStack;

			this._threads = [];
			for (let otherThread of toCopy._threads) {
				this._threads.push(otherThread.Copy());
			}
		}
	}
	// tslint:unable:unified-signatures

	public SetJsonToken(jObject: any, storyContext: any /* Story */){
		this._threads.length = 0;

		// TODO: (List<object>) jObject ["threads"];
		let jThreads: any[] = jObject['threads'];

		for (let jThreadTok of jThreads) {
			// TODO: var jThreadObj = (Dictionary<string, object>)jThreadTok;
			let jThreadObj = jThreadTok;
			let thread = new CallStack.Thread(jThreadObj, storyContext);
			this._threads.push(thread);
		}

		// TODO: (int)jObject ["threadCounter"];
		this._threadCounter = parseInt(jObject['threadCounter']);
	}
	public GetJsonToken(){
		let jObject: any = {};

		let jThreads: any[] = [];

		for (let thread of this._threads) {
			jThreads.push(thread.jsonToken);
		}

		jObject['threads'] = jThreads;
		jObject['threadCounter'] = this._threadCounter;

		return jObject;
	}

	public PushThread(){
		let newThread = this.currentThread.Copy();
		this._threadCounter++;
		newThread.threadIndex = this._threadCounter;
		this._threads.push(newThread);
	}
	public PopThread(){
		if (this.canPopThread) {
			this._threads.splice(this._threads.indexOf(this.currentThread), 1);// should be equivalent to a pop()
		} else {
			throw new Error("Can't pop thread");
		}
	}

	get canPopThread(){
		return this._threads.length > 1 && !this.elementIsEvaluateFromGame;
	}

	get elementIsEvaluateFromGame(){
		return this.currentElement.type == PushPopType.FunctionEvaluationFromGame;
	}

	public Push(type: PushPopType, externalEvaluationStackHeight: number = 0, outputStreamLengthWithPushed: number = 0){
		let element = new CallStack.Element(
			type,
			this.currentElement.currentPointer,
			false,
		);

		element.evaluationStackHeightWhenPushed = externalEvaluationStackHeight;
		element.functionStartInOutputStream = outputStreamLengthWithPushed;

		this.callStack.push (element);
	}

	public CanPop(type: PushPopType | null = null){
		if (!this.canPop)
			return false;

		if (type == null)
			return true;

		return this.currentElement.type == type;
	}

	public Pop(type: PushPopType | null = null){
		if (this.CanPop(type)) {
			this.callStack.pop();
			return;
		} else {
			throw new Error('Mismatched push/pop in Callstack');
		}
	}

	public GetTemporaryVariableWithName(name: string | null, contextIndex: number = -1){

		if (contextIndex == -1)
			contextIndex = this.currentElementIndex + 1;

		let contextElement = this.callStack[contextIndex - 1];

		let varValue = tryGetValueFromMap(contextElement.temporaryVariables, name, null);
		if (varValue.exists) {
			return varValue.result;
		} else {
			return null;
		}
	}

	public SetTemporaryVariable(name: string, value: any, declareNew: boolean, contextIndex: number = -1){

		if (contextIndex == -1)
			contextIndex = this.currentElementIndex + 1;

		let contextElement = this.callStack[contextIndex - 1];

		if (!declareNew && !contextElement.temporaryVariables.get(name)) {
			throw new StoryException('Could not find temporary variable to set: ' + name);
		}

		let oldValue = tryGetValueFromMap(contextElement.temporaryVariables, name, null);
		if (oldValue.exists)
			ListValue.RetainListOriginsForAssignment(oldValue.result, value);

		contextElement.temporaryVariables.set(name, value);
	}

	public ContextForVariableNamed(name: string){

		if (this.currentElement.temporaryVariables.get(name)) {
			return this.currentElementIndex + 1;
		}

		else {
			return 0;
		}
	}

	public ThreadWithIndex(index: number){
		let filtered = this._threads.filter((t) => {
			if (t.threadIndex == index) return t;
		});

		return filtered[0];
	}

	get callStack(){
		return this.currentThread.callstack;
	}

	get callStackTrace(){
		const sb = new StringBuilder();

		for (let t = 0; t < this._threads.length; t++) {
			let thread = this._threads[t];
			let isCurrent = (t == this._threads.length - 1);
			sb.AppendFormat('=== THREAD {0}/{1} {2}===\n', (t+1), this._threads.length, (isCurrent ? '(current) ' : ''));

			for (let i = 0; i < thread.callstack.length; i++) {

				if (thread.callstack[i].type == PushPopType.Function)
					sb.Append('  [FUNCTION] ');
				else
					sb.Append('  [TUNNEL] ');

				let pointer = thread.callstack[i].currentPointer;
				if(!pointer.isNull) {
					sb.Append('<SOMEWHERE IN ');
					if (pointer.container === null) { return throwNullException('pointer.container'); }
					sb.Append(pointer.container.path.toString());
					sb.AppendLine('>');
				}
			}
		}

		return sb.toString();
	}

	public _threads: CallStack.Thread[];
	public _threadCounter: number = 0;
}

export namespace CallStack {
	export class Element{
		public currentPointer: Pointer;
		public inExpressionEvaluation: boolean;
		public temporaryVariables: Map<string, InkObject>;
		public type: PushPopType;

		public evaluationStackHeightWhenPushed: number = 0;
		public functionStartInOutputStream: number = 0;

		constructor(type: PushPopType, pointer: Pointer, inExpressionEvaluation: boolean = false){
			this.currentPointer = pointer.copy();
			this.inExpressionEvaluation = inExpressionEvaluation;
			this.temporaryVariables = new Map();
			this.type = type;
		}

		public Copy(){
			let copy = new Element(this.type, this.currentPointer, this.inExpressionEvaluation);
			copy.temporaryVariables = new Map(this.temporaryVariables);
			copy.evaluationStackHeightWhenPushed = this.evaluationStackHeightWhenPushed;
			copy.functionStartInOutputStream = this.functionStartInOutputStream;
			return copy;
		}
	}

	export class Thread{
		public callstack: Element[];
		public threadIndex: number = 0;
		public previousPointer: Pointer = Pointer.Null;

		constructor();
		constructor(jThreadObj: any, storyContext: any /* Story */);
		constructor(){
			this.callstack = [];

			if (arguments[0] && arguments[1]){
				let jThreadObj = arguments[0];
				let storyContext = arguments[1];

				// TODO: (int) jThreadObj['threadIndex'] can raise;
				this.threadIndex = parseInt(jThreadObj['threadIndex']);

				let jThreadCallstack = jThreadObj['callstack'];

				for (let jElTok of jThreadCallstack) {
					let jElementObj = jElTok;

					// TODO: (int) jElementObj['type'] can raise;
					let pushPopType: PushPopType = parseInt(jElementObj['type']);

					let pointer = Pointer.Null;

					let currentContainerPathStr: string;
					// TODO: jElementObj.TryGetValue ("cPath", out currentContainerPathStrToken);
					const currentContainerPathStrToken = jElementObj['cPath'];
					if (typeof currentContainerPathStrToken !== 'undefined') {
						currentContainerPathStr = currentContainerPathStrToken.toString();

						let threadPointerResult = storyContext.ContentAtPath(new Path(currentContainerPathStr));
						pointer.container = threadPointerResult.container;
						pointer.index = parseInt(jElementObj['idx']);

						if (threadPointerResult.obj == null)
							throw new Error('When loading state, internal story location couldn\'t be found: ' + currentContainerPathStr + '. Has the story changed since this save data was created?');
						else if (threadPointerResult.approximate) {
							if (pointer.container === null) { return throwNullException('pointer.container'); }
							storyContext.Warning("When loading state, exact internal story location couldn't be found: '" + currentContainerPathStr + "', so it was approximated to '"+pointer.container.path.toString()+"' to recover. Has the story changed since this save data was created?");
						}
					}

					let inExpressionEvaluation = !!jElementObj['exp'];

					let el = new Element(pushPopType, pointer, inExpressionEvaluation);

					let jObjTemps = jElementObj['temp'];
					el.temporaryVariables = JsonSerialisation.JObjectToDictionaryRuntimeObjs(jObjTemps);

					this.callstack.push(el);
				}

				let prevContentObjPath = jThreadObj['previousContentObject'];
				if(typeof prevContentObjPath !== 'undefined') {
					let prevPath = new Path(prevContentObjPath.toString());
					this.previousPointer = storyContext.PointerAtPath(prevPath);
				}
			}
		}

		public Copy(){
			let copy = new Thread();
			copy.threadIndex = this.threadIndex;
			for (let e of this.callstack) {
				copy.callstack.push(e.Copy());
			}
			copy.previousPointer = this.previousPointer.copy();
			return copy;
		}

		get jsonToken(){
			let threadJObj: any = {};

			let jThreadCallstack: any[] = [];
			for (let el of this.callstack) {
				let jObj: any = {};
				if (!el.currentPointer.isNull) {
					if (el.currentPointer.container === null) { return throwNullException('el.currentPointer.container'); }
					jObj['cPath'] = el.currentPointer.container.path.componentsString;
					jObj['idx'] = el.currentPointer.index;
				}
				jObj['exp'] = el.inExpressionEvaluation;
				jObj['type'] = el.type;
				jObj['temp'] = JsonSerialisation.DictionaryRuntimeObjsToJObject(el.temporaryVariables);
				jThreadCallstack.push(jObj);
			}

			threadJObj['callstack'] = jThreadCallstack;
			threadJObj['threadIndex'] = this.threadIndex;

			if (!this.previousPointer.isNull) {
				let resolvedPointer = this.previousPointer.Resolve();
				if (resolvedPointer === null) { return throwNullException('this.previousPointer.Resolve()'); }
				threadJObj['previousContentObject'] = resolvedPointer.path.toString();
			}

			return threadJObj;
		}
	}
}
