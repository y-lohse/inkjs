//complete
import {Path} from './Path';
import {PushPopType} from './PushPop';
import {Object as InkObject} from './Object';

export class Divert extends InkObject{
	constructor(stackPushType){
		super();
		this._targetPath;
		this._targetContent;
		
		this.variableDivertName;
		this.pushesToStack;
		this.stackPushType;
		
		this.isExternal;
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
			var targetObj = this.targetContent;
			if (targetObj) {
				this._targetPath = targetObj.path;
			}
		}
		
		return this._targetPath;
	}
	set targetPath(value){
		this._targetPath = value;
		this._targetContent = null;
	}
	get targetContent(){
		if (this._targetContent == null) {
			this._targetContent = this.ResolvePath(this._targetPath);
		}

		return this._targetContent;
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

			var sb = '';

			var targetStr = this.targetPath.toString();
//			int? targetLineNum = DebugLineNumberOfPath (targetPath);
			var targetLineNum = null;
			if (targetLineNum != null) {
				targetStr = "line " + targetLineNum;
			}

			sb += "Divert";
			if (this.pushesToStack) {
				if (this.stackPushType == PushPopType.Function) {
					sb += " function";
				} else {
					sb += " tunnel";
				}
			}

			sb += " (";
			sb += targetStr;
			sb += ")";

			return sb;
		}
	}
}