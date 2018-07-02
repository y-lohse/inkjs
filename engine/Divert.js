import {Path} from './Path';
import {PushPopType} from './PushPop';
import {StringBuilder} from './StringBuilder';
import {Object as InkObject} from './Object';
import {Pointer} from './Pointer';

export class Divert extends InkObject{
	constructor(stackPushType){
		super();
		this._targetPath;
		this._targetPointer;

		this.variableDivertName;
		this.pushesToStack;
		this.stackPushType;

		this.isExternal;
		this.isConditional;
		this.externalArgs;

		//actual constructor
		this.pushesToStack = false;
		if (stackPushType){
			this.pushesToStack = true;
			this.stackPushType = stackPushType;
		}
	}
	get targetPath(){
		// Resolve any relative paths to global ones as we come across them
		if (this._targetPath != null && this._targetPath.isRelative) {
			var targetObj = this.targetPointer.Resolve();
			if (targetObj) {
				this._targetPath = targetObj.path;
			}
		}

		return this._targetPath;
	}
	set targetPath(value){
		this._targetPath = value;
		this._targetPointer = Pointer.Null;
	}
	get targetPointer(){
		if (this._targetPointer.isNull) {
			var targetObj = this.ResolvePath(this._targetPath).obj;

			if (this._targetPath.lastComponent.isIndex) {
				_targetPointer.container = targetObj.parent;
				_targetPointer.index = this._targetPath.lastComponent.index;
			} else {
				_targetPointer = Pointer.StartOf(targetObj);
			}
		}

		return this._targetPointer;
	}
	get targetPathString(){
		if (this.targetPath == null)
			return null;

		return this.CompactPathString(this.targetPath);
	}
	set targetPathString(value){
		if (value == null) {
			this.targetPath = null;
		} else {
			this.targetPath = new Path(value);
		}
	}
	get hasVariableTarget(){
		return this.variableDivertName != null;
	}

	Equals(obj){
//		var otherDivert = obj as Divert;
		var otherDivert = obj;
		if (otherDivert instanceof Divert) {
			if (this.hasVariableTarget == otherDivert.hasVariableTarget) {
				if (this.hasVariableTarget) {
					return this.variableDivertName == otherDivert.variableDivertName;
				} else {
					return this.targetPath.Equals(otherDivert.targetPath);
				}
			}
		}
		return false;
	}
	toString(){
		if (this.hasVariableTarget) {
			return "Divert(variable: " + this.variableDivertName + ")";
		}
		else if (this.targetPath == null) {
			return "Divert(null)";
		} else {

			var sb = new StringBuilder;

			var targetStr = this.targetPath.toString();
//			int? targetLineNum = DebugLineNumberOfPath (targetPath);
			var targetLineNum = null;
			if (targetLineNum != null) {
				targetStr = "line " + targetLineNum;
			}

			sb.Append("Divert");

			if (this.isConditional) {
				sb.Append("?");
			}

			if (this.pushesToStack) {
				if (this.stackPushType == PushPopType.Function) {
					sb.Append(" function");
				} else {
					sb.Append(" tunnel");
				}
			}

			sb.Append(" -> ");
			sb.Append(this.targetPathString);

			sb.Append(" (");
			sb.Append(targetStr);
			sb.Append(")");

			return sb.toString();
		}
	}
}