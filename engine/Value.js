import {Object as InkObject} from './Object';
import {Path} from './Path';

var ValueType = {
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
		throw "Cast to " + newType + "not implemnted";
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
}

export class DivertTargetValue extends Value{
	
}