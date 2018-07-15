import {Object as InkObject} from './Object';
import {Path} from './Path';
import {InkList} from './InkList';
import {StoryException} from './StoryException';

export var ValueType = {
	// Used in coersion
	Int: 0,
	Float: 1,
	List: 2,
	String: 3,

	// Not used for coersion described above
	DivertTarget: 4,
	VariablePointer: 5
}

class AbstractValue extends InkObject{
	constructor(val){
		super();
		this._valueType;
		this._isTruthy;
		this._valueObject;
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
		throw "Trying to casting an AbstractValue";
	}
	static Create(val){
		// Implicitly convert bools into ints
		if (typeof val === 'boolean'){
			var b = !!val;
			val = (b) ? 1 : 0;
		}

		if (Number.isInteger(Number(val))) {
			return new IntValue(val);
		} else if (!isNaN(val)) {
			return new FloatValue(val);
		} else if (typeof val === 'string') {
			return new StringValue(val);
		} else if (val instanceof Path) {
			return new DivertTargetValue(val);
		} else if (val instanceof InkList) {
			return new ListValue(val);
		}

		return null;
	}
	Copy(val){
		return AbstractValue.Create(val);
	}
	BadCastException (targetType) {
		return new StoryException("Can't cast "+this.valueObject+" from " + this.valueType+" to "+targetType);
	}
}

export class Value extends AbstractValue{
	constructor(val){
		super();
		this.value = val;
	}
	get value(){
		return this._value;
	}
	set value(value){
		this._value = value;
	}
	get valueObject(){
		return this.value;
	}
	toString(){
		return this.value.toString();
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

		throw this.BadCastException(newType);
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

		throw this.BadCastException(newType);
	}
}

export class StringValue extends Value{
	constructor(val){
		super(val || '');
		this._valueType = ValueType.String;

		this._isNewline = (this.value == "\n");
		this._isInlineWhitespace = true;

		// Splitting "" yields [""] which isn't what we want. Thanks JS!
		if( this.value.length > 0 ) {
			this.value.split().every(c => {
				if (c != ' ' && c != '\t'){
					this._isInlineWhitespace = false;
					return false;
				}
	
				return true;
			});
		}
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

	Cast(newType){
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

		throw this.BadCastException(newType);
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

		throw this.BadCastException(newType);
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

		throw this.BadCastException(newType);
	}
	toString(){
		return "VariablePointerValue(" + this.variableName + ")";
	}
	Copy(){
		return new VariablePointerValue(this.variableName, this.contextIndex);
	}
}

export class ListValue extends Value{
	get valueType(){
		return ValueType.List;
	}
	get isTruthy(){
		var isTruthy = false;
		this.value.forEach(function(kv){
			var listItemIntValue = kv.Value;
			if (listItemIntValue != 0)
				isTruthy = true;
		});
		return isTruthy;
	}
	Cast(newType){
		 if (newType == ValueType.Int) {
			var max = this.value.maxItem;
			if( max.Key.isNull )
				return new IntValue(0);
			else
				return new IntValue(max.Value);
		}

		else if (newType == ValueType.Float) {
			var max = this.value.maxItem;
			if (max.Key.isNull)
				return new FloatValue(0.0);
			else
				return new FloatValue(parseFloat(max.Value));
		}

		else if (newType == ValueType.String) {
			var max = value.maxItem;
			if (max.Key.isNull)
				return new StringValue("");
			else {
				return new StringValue(max.Key.toString());
			}
		}

		if (newType == this.valueType)
			return this;

		throw this.BadCastException(newType);
	}
	constructor(listOrSingleItem, singleValue){
		super(null);

		this._valueType = ValueType.List;

		if (listOrSingleItem instanceof InkList){
			this.value = new InkList(listOrSingleItem);
		}
		else if (listOrSingleItem !== undefined && singleValue !== undefined){
			this.value = new InkList({
				Key: listOrSingleItem,
				Value: singleValue
			});
		}
		else{
			this.value = new InkList();
		}
	}
	static RetainListOriginsForAssignment(oldValue, newValue){
//		var oldList = oldValue as ListValue;
		var oldList = oldValue;
//		var newList = newValue as ListValue;
		var newList = newValue;

		// When assigning the emtpy list, try to retain any initial origin names
		if (oldList instanceof ListValue && newList instanceof ListValue && newList.value.Count == 0)
			newList.value.SetInitialOriginNames(oldList.value.originNames);
	}
}