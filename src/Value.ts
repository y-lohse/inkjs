import {InkObject} from './Object';
import {Path} from './Path';
import {InkList} from './InkList';
import {StoryException} from './StoryException';

abstract class AbstractValue extends InkObject{
	public abstract _valueType: Value.ValueType;
	public abstract _isTruthy: boolean;
	public abstract _valueObject: any;

	public get valueType(): Value.ValueType{
		return this._valueType;
	}
	public get isTruthy(): boolean{
		return this._isTruthy;
	}
	public get valueObject(): any{
		return this._valueObject;
	}

	public abstract Cast(newType: Value.ValueType): Value<any>;

	public static Create(val: any): Value<any> | null{
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
	public Copy(val: any): Value<any> | null{
		return AbstractValue.Create(val);
	}
	public BadCastException (targetType: Value.ValueType): StoryException {
		return new StoryException("Can't cast "+this.valueObject+" from " + this.valueType+" to "+targetType);
	}
}

export abstract class Value<T> extends AbstractValue{
	public value: T;

	constructor(val: T){
		super();
		this.value = val;
	}
	public get valueObject(): any{
		return this.value;
	}
	public toString(): string{
		return this.value.toString();
	}
}

export class IntValue extends Value<number>{
	constructor(val: number){
		super(val || 0);
		this._valueType = Value.ValueType.Int;
	}
	public get isTruthy(): boolean{
		return this.value != 0;
	}
	public get valueType(): Value.ValueType{
		return Value.ValueType.Int;
	}

	public Cast(newType: Value.ValueType): Value<any> | null{
		if (newType == this.valueType) {
			return this;
		}

		if (newType == Value.ValueType.Float) {
			return new FloatValue(this.value);
		}

		if (newType == Value.ValueType.String) {
			return new StringValue("" + this.value);
		}

		throw this.BadCastException(newType);
	}
}

export class FloatValue extends Value<number>{
	constructor(val: number){
		super(val || 0.0);
		this._valueType = Value.ValueType.Float;
	}
	public get isTruthy(): boolean{
		return this.value != 0.0;
	}
	public get valueType(){
		return Value.ValueType.Float;
	}

	public Cast(newType: Value.ValueType): Value<any> | null{
		if (newType == this.valueType) {
			return this;
		}

		if (newType == Value.ValueType.Int) {
			return new IntValue(this.value);
		}

		if (newType == Value.ValueType.String) {
			return new StringValue("" + this.value);
		}

		throw this.BadCastException(newType);
	}
}

export class StringValue extends Value<string>{
	public _isNewline: boolean;
	public _isInlineWhitespace: boolean;

	constructor(val: string){
		super(val || '');
		this._valueType = Value.ValueType.String;

		this._isNewline = (this.value == "\n");
		this._isInlineWhitespace = true;

		this.value.split('').every(c => {
			if (c != ' ' && c != '\t'){
				this._isInlineWhitespace = false;
				return false;
			}

			return true;
		});
	}
	public get valueType(): Value.ValueType{
		return Value.ValueType.String;
	}
	public get isTruthy(): boolean{
		return this.value.length > 0;
	}
	public get isNewline(): boolean{
		return this._isNewline;
	}
	public get isInlineWhitespace(): boolean{
		return this._isInlineWhitespace;
	}
	public get isNonWhitespace(): boolean{
		return !this.isNewline && !this.isInlineWhitespace;
	}

	public Cast(newType: Value.ValueType): Value<any> | null{
		if (newType == this.valueType) {
			return this;
		}

		if (newType == Value.ValueType.Int) {

			let parsedInt;
			if (parsedInt = parseInt(this.value)) {
				return new IntValue(parsedInt);
			} else {
				return null;
			}
		}

		if (newType == Value.ValueType.Float) {
			let parsedFloat;
			if (parsedFloat = parsedFloat(this.value)) {
				return new FloatValue(parsedFloat);
			} else {
				return null;
			}
		}

		throw this.BadCastException(newType);
	}
}

export class DivertTargetValue extends Value<Path>{
	constructor(targetPath: Path){
		super(targetPath);

		this._valueType = Value.ValueType.DivertTarget;
	}
	public get targetPath(): Path{
		return this.value;
	}
	public set targetPath(value: Path){
		this.value = value;
	}
	public get isTruthy(): never{
		throw "Shouldn't be checking the truthiness of a divert target";
	}

	public Cast(newType: Value.ValueType): Value<any>{
		if (newType == this.valueType)
			return this;

		throw this.BadCastException(newType);
	}
	public toString(): string{
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

export namespace Value{
  export enum ValueType {
    Int = 0,
  	Float = 1,
  	List = 2,
  	String = 3,
  	DivertTarget = 4,
  	VariablePointer = 5
  }
}
