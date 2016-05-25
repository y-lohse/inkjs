// Order is significant for type coersion.
// If types aren't directly compatible for an operation,
// they're coerced to the same type, downward.
// Higher value types "infect" an operation.
// (This may not be the most sensible thing to do, but it's worked so far!)
var ValueType = {
	// Used in coersion
	Int: 'Int',
	Float: 'Float',
	String: 'String',

	// Not used for coersion described above
	DivertTarget: 'DivertTarget',
	VariablePointer: 'VariablePointer'
}

export class Value{
	constructor(val){
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
	static Create(val){
		// Implicitly convert bools into ints
		if (val instanceof Boolean){
			var b = !!val;
			val = (b) ? 1 : 0;
		}

		if (Number.isInteger(val)) {
			return new IntValue(val);
		} else if (Number.isFloatval) {
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