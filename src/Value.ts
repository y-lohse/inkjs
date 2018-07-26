import {InkObject} from './Object';
import {Path} from './Path';
import {InkList, InkListItem} from './InkList';
import {StoryException} from './StoryException';
<<<<<<< HEAD
import {asOrNull, asOrThrows} from './TypeAssertion';
=======
import {asOrNull} from './TypeAssertion';
>>>>>>> Finished first pass

abstract class AbstractValue extends InkObject{
	public abstract get valueType(): ValueType;
	public abstract get isTruthy(): boolean;
	public abstract get valueObject(): any;

	public abstract Cast(newType: ValueType): Value<any>;

	public static Create(val: any): Value<any> | null{
		// Implicitly convert bools into ints
		if (typeof val === 'boolean'){
			let b = !!val;
			val = (b) ? 1 : 0;
		}

		if (Number.isInteger(Number(val))) {
			return new IntValue(Number(val));
		} else if (!isNaN(val)) {
			return new FloatValue(Number(val));
		} else if (typeof val === 'string') {
			return new StringValue(String(val));
		} else if (val instanceof Path) {
			return new DivertTargetValue(asOrThrows(val, Path));
		} else if (val instanceof InkList) {
			return new ListValue(asOrThrows(val, InkList));
		}

		return null;
	}
	public Copy(): InkObject {
		return asOrThrows(AbstractValue.Create(this), InkObject);
	}
<<<<<<< HEAD
<<<<<<< HEAD
	public BadCastException (targetType: ValueType): StoryException {
		return new StoryException("Can't cast "+this.valueObject+" from " + this.valueType+" to "+targetType);
=======
	public BadCastException(targetType: Value.ValueType): StoryException {
		return new StoryException('Can\'t cast '+this.valueObject+' from ' + this.valueType+' to '+targetType);
>>>>>>> Finished first pass
=======
	public BadCastException(targetType: ValueType): StoryException {
		return new StoryException("Can't cast "+this.valueObject+' from ' + this.valueType+' to '+targetType);
>>>>>>> linting
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
	}
	public get isTruthy(): boolean{
		return this.value != 0;
	}
	public get valueType(): ValueType {
		return ValueType.Int;
	}

	public Cast(newType: ValueType): Value<any>{
		if (newType == this.valueType) {
			return this;
		}

		if (newType == ValueType.Float) {
			return new FloatValue(this.value);
		}

<<<<<<< HEAD
		if (newType == ValueType.String) {
<<<<<<< HEAD
			return new StringValue("" + this.value);
=======
		if (newType == Value.ValueType.String) {
			return new StringValue('' + this.value);
>>>>>>> Finished first pass
=======
			return new StringValue('' + this.value);
>>>>>>> linting
		}

		throw this.BadCastException(newType);
	}
}

export class FloatValue extends Value<number>{
	constructor(val: number){
		super(val || 0.0);
	}
	public get isTruthy(): boolean{
		return this.value != 0.0;
	}
	public get valueType(){
		return ValueType.Float;
	}

	public Cast(newType: ValueType): Value<any>{
		if (newType == this.valueType) {
			return this;
		}

		if (newType == ValueType.Int) {
			return new IntValue(this.value);
		}

<<<<<<< HEAD
		if (newType == ValueType.String) {
<<<<<<< HEAD
			return new StringValue("" + this.value);
=======
		if (newType == Value.ValueType.String) {
			return new StringValue('' + this.value);
>>>>>>> Finished first pass
=======
			return new StringValue('' + this.value);
>>>>>>> linting
		}

		throw this.BadCastException(newType);
	}
}

export class StringValue extends Value<string>{
	public _isNewline: boolean;
	public _isInlineWhitespace: boolean;

	constructor(val: string){
		super(val || '');

		this._isNewline = (this.value == '\n');
		this._isInlineWhitespace = true;

		this.value.split('').every((c) => {
			if (c != ' ' && c != '\t'){
				this._isInlineWhitespace = false;
				return false;
			}

			return true;
		});
	}
	public get valueType(): ValueType{
		return ValueType.String;
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

	public Cast(newType: ValueType): Value<any>{
		if (newType == this.valueType) {
			return this;
		}

		if (newType == ValueType.Int) {

			let parsedInt;
			if (parsedInt = parseInt(this.value)) {
				return new IntValue(parsedInt);
			} else {
				throw this.BadCastException(newType);
			}
		}

		if (newType == ValueType.Float) {
			let parsedFloat;
			if (parsedFloat = parseFloat(this.value)) {
				return new FloatValue(parsedFloat);
			} else {
				throw this.BadCastException(newType);
			}
		}

		throw this.BadCastException(newType);
	}
}

export class DivertTargetValue extends Value<Path>{
	constructor(targetPath: Path){
		super(targetPath);

	}
	public get valueType(): ValueType {
		return ValueType.DivertTarget;
	}
	public get targetPath(): Path{
		return this.value;
	}
	public set targetPath(value: Path){
		this.value = value;
	}
	public get isTruthy(): never{
		throw new Error('Shouldn\'t be checking the truthiness of a divert target');
	}

	public Cast(newType: ValueType): Value<any>{
		if (newType == this.valueType)
			return this;

		throw this.BadCastException(newType);
	}
	public toString(): string{
		return 'DivertTargetValue(' + this.targetPath + ')';
	}
}

export class VariablePointerValue extends Value<string>{
<<<<<<< HEAD
<<<<<<< HEAD
    _contextIndex: number;

=======
	public _contextIndex: number;
>>>>>>> linting

	constructor(variableName: string, contextIndex: number = -1){
		super(variableName);

		this._contextIndex = contextIndex;
	}

<<<<<<< HEAD
    public get contextIndex(): number{
        return this._contextIndex;
    }
    public set contextIndex(value: number) {
        this._contextIndex = value;
    }
=======
	public contextIndex: number;

	constructor(variableName: string, contextIndex: number = -1){
		super(variableName);

		this._valueType = Value.ValueType.VariablePointer;
		this.contextIndex = contextIndex;
	}
>>>>>>> Finished first pass
=======
	public get contextIndex(): number{
		return this._contextIndex;
	}
	public set contextIndex(value: number) {
		this._contextIndex = value;
	}
>>>>>>> linting
	public get variableName(): string{
		return this.value;
	}
	public set variableName(value: string){
		this.value = value;
<<<<<<< HEAD
<<<<<<< HEAD
    }
    public get valueType(): ValueType {
        return ValueType.VariablePointer;
    }
	
=======
	}
	public get valueType(): ValueType {
		return ValueType.VariablePointer;
	}

>>>>>>> linting
	public get isTruthy(): never{
		throw new Error("Shouldn't be checking the truthiness of a variable pointer");
	}

<<<<<<< HEAD
    Cast(newType: ValueType): Value<any>{
=======
	}
	get isTruthy(): never{
		throw new Error('Shouldn\'t be checking the truthiness of a variable pointer');
	}

	public Cast(newType: Value.ValueType): Value<any>{
>>>>>>> Finished first pass
=======
	public Cast(newType: ValueType): Value<any>{
>>>>>>> linting
		if (newType == this.valueType)
			return this;

		throw this.BadCastException(newType);
	}
	public toString(): string{
		return 'VariablePointerValue(' + this.variableName + ')';
	}
<<<<<<< HEAD
<<<<<<< HEAD
	Copy(): InkObject{
=======
	public Copy(): VariablePointerValue{
>>>>>>> Finished first pass
=======
	public Copy(): InkObject{
>>>>>>> linting
		return new VariablePointerValue(this.variableName, this.contextIndex);
	}
}

export class ListValue extends Value<InkList>{
<<<<<<< HEAD
	public get isTruthy(): boolean{
<<<<<<< HEAD
		var isTruthy = false;
		this.value.forEach(function(value, key, map){
			var listItemIntValue = value;
=======
	public get valueType(): Value.ValueType{
		return Value.ValueType.List;
	}
	public get isTruthy(){
		let isTruthy = false;
		this.value.forEach((kv: KeyValuePair<InkListItem, number>) => {
			let listItemIntValue = kv.Value;
>>>>>>> Finished first pass
=======
		let isTruthy = false;
		this.value.forEach((value, key, map) => {
			let listItemIntValue = value;
>>>>>>> linting
			if (listItemIntValue != 0)
				isTruthy = true;
		});
		return isTruthy;
	}
<<<<<<< HEAD
<<<<<<< HEAD
    public get valueType(): ValueType {
        return ValueType.List;
    }
    Cast(newType: ValueType): Value<any>{
		 if (newType == ValueType.Int) {
			var max = this.value.maxItem;
=======
	public Cast(newType: Value.ValueType): Value<any>{
		 if (newType == Value.ValueType.Int) {
			let max = this.value.maxItem;
>>>>>>> Finished first pass
=======
	public get valueType(): ValueType {
		return ValueType.List;
	}
	public Cast(newType: ValueType): Value<any>{
		 if (newType == ValueType.Int) {
			let max = this.value.maxItem;
>>>>>>> linting
			if( max.Key.isNull )
				return new IntValue(0);
			else
				return new IntValue(max.Value);
		}

		else if (newType == ValueType.Float) {
			let max = this.value.maxItem;
			if (max.Key.isNull)
				return new FloatValue(0.0);
			else
				return new FloatValue(max.Value);
		}

		else if (newType == ValueType.String) {
<<<<<<< HEAD
<<<<<<< HEAD
			var max = this.value.maxItem;
=======
			let max = value.maxItem;
>>>>>>> Finished first pass
=======
			let max = this.value.maxItem;
>>>>>>> linting
			if (max.Key.isNull)
				return new StringValue('');
			else {
				return new StringValue(max.Key.toString());
			}
		}

		 if (newType == this.valueType) return this;

		 throw this.BadCastException(newType);
	}
<<<<<<< HEAD
	constructor(listOrSingleItem?: InkList | InkListItem, singleValue?: number){
=======
	// tslint:disable:unified-signatures
	constructor()
	constructor(list: InkList)
	constructor(listOrSingleItem: InkListItem, singleValue: number)
	constructor(listOrSingleItem, singleValue){
		super(null);

		this._valueType = Value.ValueType.List;

>>>>>>> Finished first pass
		if (listOrSingleItem instanceof InkList){
			super(new InkList(listOrSingleItem));
		}
<<<<<<< HEAD
		else if (listOrSingleItem !== undefined && singleValue !== undefined){
			super(new InkList({
				Key: listOrSingleItem,
				Value: singleValue,
			}));
=======
		else if (listOrSingleItem && singleValue){
			this.value = new InkList({
				Key: listOrSingleItem,
				Value: singleValue,
			});
>>>>>>> Finished first pass
		}
		else{
			super(new InkList());
		}
	}
<<<<<<< HEAD
<<<<<<< HEAD
	static RetainListOriginsForAssignment(oldValue: InkObject, newValue: InkObject){
        var oldList = asOrNull(oldValue, ListValue);
        var newList = asOrNull(newValue, ListValue);
=======
	public static RetainListOriginsForAssignment(oldValue: InkObject, newValue: InkObject){
		let oldList = asOrNull(oldValue, ListValue);
		let newList = asOrNull(newValue, ListValue);
>>>>>>> linting

		// When assigning the empty list, try to retain any initial origin names
=======
	public static RetainListOriginsForAssignment(oldValue: any, newValue: any): void{
		let oldList = asOrNull(oldValue, ListValue);
		let newList = asOrNull(newValue, ListValue);

		// When assigning the emtpy list, try to retain any initial origin names
>>>>>>> Finished first pass
		if (oldList && newList && newList.value.Count == 0)
			newList.value.SetInitialOriginNames(oldList.value.originNames);
	}
}

<<<<<<< HEAD
export enum ValueType {
<<<<<<< HEAD
    Int = 0,
    Float = 1,
    List = 2,
    String = 3,
    DivertTarget = 4,
    VariablePointer = 5
=======
export namespace Value{
  export enum ValueType {
	Int = 0,
  	Float = 1,
  	List = 2,
  	String = 3,
  	DivertTarget = 4,
  	VariablePointer = 5,
  }
>>>>>>> Finished first pass
=======
	Int = 0,
	Float = 1,
	List = 2,
	String = 3,
	DivertTarget = 4,
	VariablePointer = 5,
>>>>>>> linting
}
