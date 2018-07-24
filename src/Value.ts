import {InkObject} from './Object';
import {Path} from './Path';
import {InkList, InkListItem} from './InkList';
import {StoryException} from './StoryException';
import {asOrNull, asOrThrows} from './TypeAssertion';

abstract class AbstractValue extends InkObject{
	public abstract get valueType(): ValueType;
	public abstract get isTruthy(): boolean;
	public abstract get valueObject(): any;

	public abstract Cast(newType: ValueType): Value<any>;

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
	public Copy(): InkObject {
        return asOrThrows(AbstractValue.Create(this), InkObject);
	}
	public BadCastException (targetType: ValueType): StoryException {
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

		if (newType == ValueType.String) {
			return new StringValue("" + this.value);
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

		if (newType == ValueType.String) {
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
		throw "Shouldn't be checking the truthiness of a divert target";
	}

	public Cast(newType: ValueType): Value<any>{
		if (newType == this.valueType)
			return this;

		throw this.BadCastException(newType);
	}
	public toString(): string{
		return "DivertTargetValue(" + this.targetPath + ")";
	}
}

export class VariablePointerValue extends Value<string>{
    _contextIndex: number;


	constructor(variableName: string, contextIndex: number | undefined){
		super(variableName);

		this._contextIndex = (typeof contextIndex !== 'undefined') ? contextIndex : -1;
	}

    public get contextIndex(): number{
        return this._contextIndex;
    }
    public set contextIndex(value: number) {
        this._contextIndex = value;
    }
	public get variableName(): string{
		return this.value;
	}
	public set variableName(value: string){
		this.value = value;
    }
    public get valueType(): ValueType {
        return ValueType.VariablePointer;
    }
	
	public get isTruthy(): never{
		throw "Shouldn't be checking the truthiness of a variable pointer";
	}

    Cast(newType: ValueType): Value<any>{
		if (newType == this.valueType)
			return this;

		throw this.BadCastException(newType);
	}
	toString(){
		return "VariablePointerValue(" + this.variableName + ")";
	}
	Copy(): InkObject{
		return new VariablePointerValue(this.variableName, this.contextIndex);
	}
}

export class ListValue extends Value<InkList>{
	public get isTruthy(): boolean{
		var isTruthy = false;
		this.value.forEach(function(value, key, map){
			var listItemIntValue = value;
			if (listItemIntValue != 0)
				isTruthy = true;
		});
		return isTruthy;
	}
    public get valueType(): ValueType {
        return ValueType.List;
    }
    Cast(newType: ValueType): Value<any>{
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
				return new FloatValue(max.Value);
		}

		else if (newType == ValueType.String) {
			var max = this.value.maxItem;
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
	constructor(listOrSingleItem?: InkList | InkListItem, singleValue?: number){
		if (listOrSingleItem instanceof InkList){
            super(new InkList(listOrSingleItem));
		}
		else if (listOrSingleItem !== undefined && singleValue !== undefined){
			super(new InkList({
				Key: listOrSingleItem,
				Value: singleValue
			}));
		}
		else{
			super(new InkList());
		}
	}
	static RetainListOriginsForAssignment(oldValue: InkObject, newValue: InkObject){
        var oldList = asOrNull(oldValue, ListValue);
        var newList = asOrNull(newValue, ListValue);

		// When assigning the empty list, try to retain any initial origin names
		if (oldList && newList && newList.value.Count == 0)
			newList.value.SetInitialOriginNames(oldList.value.originNames);
	}
}

export enum ValueType {
    Int = 0,
    Float = 1,
    List = 2,
    String = 3,
    DivertTarget = 4,
    VariablePointer = 5
}
