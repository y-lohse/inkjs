//complete
import {Object as InkObject} from './Object';
import {Path} from './Path';

export var ValueType = {
	// Used in coersion
	Int: 0,
	Float: 1,
	String: 2,

	// Not used for coersion described above
	DivertTarget: 3,
	VariablePointer: 4
}

export class Value extends InkObject{
	constructor(val){
		super();
		this._value = val;
		this._valueType;
		this._isTruthy;
		this._valueObject;
	}
	get value(){
		return this._value;
	}
	set value(value){
		this._value = value;
	}
	get valueType(){
		return this._valueType;
	}
	get isTruthy(){
		return this._isTruthy;
	}
	get valueObject(){
		return this._valueObject;
	}
	
	Cast(newType){
		throw "Cast to " + newType + "not implemented";
	}
	Copy(val){
		return this.Create(val);
	}
	toString(){
		return this.value.toString();
	}
	static Create(val){
		// Implicitly convert bools into ints
		if (val instanceof Boolean){
			var b = !!val;
			val = (b) ? 1 : 0;
		}

		if (Number.isInteger(Number(val))) {
			return new IntValue(val);
		} else if (!isNaN(val)) {
			return new FloatValue(val);
		} else if (val instanceof String) {
			return new StringValue(val);
		} else if (val instanceof Path) {
			return new DivertTargetValue(val);
		}
	
		return null;
	}
}

export class IntValue extends Value{
	constructor(val){
		super(val || 0);
		this._valueType = ValueType.Int;
	}
	get isTruthy(){
		return this.value != 0;
	}
	get valueType(){
		return ValueType.Int;
	}
	
	Cast(newType){
		if (newType == this.valueType) {
			return this;
		}

		if (newType == ValueType.Float) {
			return new FloatValue(parseFloat(this.value));
		}

		if (newType == ValueType.String) {
			return new StringValue("" + this.value);
		}

		throw "Unexpected type cast of Value to new ValueType";
	}
}

export class FloatValue extends Value{
	constructor(val){
		super(val || 0.0);
		this._valueType = ValueType.Float;
	}
	get isTruthy(){
		return this._value != 0.0;
	}
	get valueType(){
		return ValueType.Float;
	}
	
	Cast(newType){
		if (newType == this.valueType) {
			return this;
		}

		if (newType == ValueType.Int) {
			return new IntValue(parseInt(this.value));
		}

		if (newType == ValueType.String) {
			return new StringValue("" + this.value);
		}

		throw "Unexpected type cast of Value to new ValueType";
	}
}

export class StringValue extends Value{
	constructor(val){
		super(val || '');
		this._valueType = ValueType.String;
		
		this._isNewline = (this.value == "\n");
		this._isInlineWhitespace = true;
		
		this.value.split().every(c => {
			if (c != ' ' && c != '\t'){
				this._isInlineWhitespace = false;
				return false;
			}
			
			return true;
		});
	}
	get valueType(){
		return ValueType.String;
	}
	get isTruthy(){
		return this.value.length > 0;
	}
	get isNewline(){
		return this._isNewline;
	}
	get isInlineWhitespace(){
		return this._isInlineWhitespace;
	}
	get isNonWhitespace(){
		return !this.isNewline && !this.isInlineWhitespace;
	}
	
	Cast(newtType){
		if (newType == this.valueType) {
			return this;
		}

		if (newType == ValueType.Int) {

			var parsedInt;
			if (parsedInt = parseInt(value)) {
				return new IntValue(parsedInt);
			} else {
				return null;
			}
		}

		if (newType == ValueType.Float) {
			var parsedFloat;
			if (parsedFloat = parsedFloat(value)) {
				return new FloatValue(parsedFloat);
			} else {
				return null;
			}
		}

		throw "Unexpected type cast of Value to new ValueType";
	}
}

export class DivertTargetValue extends Value{
	constructor(targetPath){
		super(targetPath);
		
		this._valueType = ValueType.DivertTarget;
	}
	get targetPath(){
		return this.value;
	}
	set targetPath(value){
		this.value = value;
	}
	get isTruthy(){
		throw "Shouldn't be checking the truthiness of a divert target";
	}
	
	Cast(newType){
		if (newType == this.valueType)
			return this;

		throw "Unexpected type cast of Value to new ValueType";
	}
	toString(){
		return "DivertTargetValue(" + this.targetPath + ")";
	}
}

export class VariablePointerValue extends Value{
	constructor(variableName, contextIndex){
		super(variableName);
		
		this._valueType = ValueType.VariablePointer;
		this.contextIndex = (typeof contextIndex !== 'undefined') ? contextIndex : -1;
	}
	get variableName(){
		return this.value;
	}
	set variableName(value){
		this.value = value;
	}
	get isTruthy(){
		throw "Shouldn't be checking the truthiness of a variable pointer";
	}
	
	Cast(newType){
		if (newType == this.valueType)
			return this;

		throw "Unexpected type cast of Value to new ValueType";
	}
	toString(){
		return "VariablePointerValue(" + this.variableName + ")";
	}
	Copy(){
		return new VariablePointerValue(this.variableName, this.contextIndex);
	}
}