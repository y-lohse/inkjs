import { InkObject } from "./Object";
import { Path } from "./Path";
import { InkList, InkListItem } from "./InkList";
import { StoryException } from "./StoryException";
import { asOrNull, asOrThrows } from "./TypeAssertion";
import { tryParseInt, tryParseFloat } from "./TryGetResult";
import { throwNullException } from "./NullException";

export abstract class AbstractValue extends InkObject {
  public abstract get valueType(): ValueType;
  public abstract get isTruthy(): boolean;
  public abstract get valueObject(): any;

  public abstract Cast(newType: ValueType): Value<any>;

  public static Create(
    val: any,
    preferredNumberType?: ValueType
  ): Value<any> | null {
    // This code doesn't exist in upstream and is simply here to enforce
    // the creation of the proper number value.
    // If `preferredNumberType` is not provided or if value doesn't match
    // `preferredNumberType`, this conditional does nothing.
    if (preferredNumberType) {
      if (
        preferredNumberType === (ValueType.Int as ValueType) &&
        Number.isInteger(Number(val))
      ) {
        return new IntValue(Number(val));
      } else if (
        preferredNumberType === (ValueType.Float as ValueType) &&
        !isNaN(val)
      ) {
        return new FloatValue(Number(val));
      }
    }

    if (typeof val === "boolean") {
      return new BoolValue(Boolean(val));
    }

    // https://github.com/y-lohse/inkjs/issues/425
    // Changed condition sequence, because Number('') is
    // parsed to 0, which made setting string to empty
    // impossible
    if (typeof val === "string") {
      return new StringValue(String(val));
    } else if (Number.isInteger(Number(val))) {
      return new IntValue(Number(val));
    } else if (!isNaN(val)) {
      return new FloatValue(Number(val));
    } else if (val instanceof Path) {
      return new DivertTargetValue(asOrThrows(val, Path));
    } else if (val instanceof InkList) {
      return new ListValue(asOrThrows(val, InkList));
    }

    return null;
  }
  public Copy() {
    return asOrThrows(AbstractValue.Create(this.valueObject), InkObject);
  }
  public BadCastException(targetType: ValueType) {
    return new StoryException(
      "Can't cast " +
        this.valueObject +
        " from " +
        this.valueType +
        " to " +
        targetType
    );
  }
}

export abstract class Value<
  T extends { toString: () => string },
> extends AbstractValue {
  public value: T | null;

  constructor(val: T | null) {
    super();
    this.value = val;
  }
  public get valueObject() {
    return this.value;
  }
  public toString() {
    if (this.value === null) return throwNullException("Value.value");
    return this.value.toString();
  }
}

export class BoolValue extends Value<boolean> {
  constructor(val: boolean) {
    super(val || false);
  }
  public get isTruthy() {
    return Boolean(this.value);
  }
  public get valueType() {
    return ValueType.Bool;
  }

  public Cast(newType: ValueType): Value<any> {
    if (this.value === null) return throwNullException("Value.value");

    if (newType == this.valueType) {
      return this;
    }

    if (newType == ValueType.Int) {
      return new IntValue(this.value ? 1 : 0);
    }

    if (newType == ValueType.Float) {
      return new FloatValue(this.value ? 1.0 : 0.0);
    }

    if (newType == ValueType.String) {
      return new StringValue(this.value ? "true" : "false");
    }

    throw this.BadCastException(newType);
  }

  public toString() {
    return this.value ? "true" : "false";
  }
}

export class IntValue extends Value<number> {
  constructor(val: number) {
    super(val || 0);
  }
  public get isTruthy() {
    return this.value != 0;
  }
  public get valueType() {
    return ValueType.Int;
  }

  public Cast(newType: ValueType): Value<any> {
    if (this.value === null) return throwNullException("Value.value");

    if (newType == this.valueType) {
      return this;
    }

    if (newType == ValueType.Bool) {
      return new BoolValue(this.value === 0 ? false : true);
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

export class FloatValue extends Value<number> {
  constructor(val: number) {
    super(val || 0.0);
  }
  public get isTruthy() {
    return this.value != 0.0;
  }
  public get valueType() {
    return ValueType.Float;
  }

  public Cast(newType: ValueType): Value<any> {
    if (this.value === null) return throwNullException("Value.value");

    if (newType == this.valueType) {
      return this;
    }

    if (newType == ValueType.Bool) {
      return new BoolValue(this.value === 0.0 ? false : true);
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

export class StringValue extends Value<string> {
  public _isNewline: boolean;
  public _isInlineWhitespace: boolean;

  constructor(val: string) {
    super(val || "");

    this._isNewline = this.value == "\n";
    this._isInlineWhitespace = true;

    if (this.value === null) return throwNullException("Value.value");

    if (this.value.length > 0) {
      this.value.split("").every((c) => {
        if (c != " " && c != "\t") {
          this._isInlineWhitespace = false;
          return false;
        }

        return true;
      });
    }
  }
  public get valueType() {
    return ValueType.String;
  }
  public get isTruthy() {
    if (this.value === null) return throwNullException("Value.value");
    return this.value.length > 0;
  }
  public get isNewline() {
    return this._isNewline;
  }
  public get isInlineWhitespace() {
    return this._isInlineWhitespace;
  }
  public get isNonWhitespace() {
    return !this.isNewline && !this.isInlineWhitespace;
  }

  public Cast(newType: ValueType): Value<any> {
    if (newType == this.valueType) {
      return this;
    }

    if (newType == ValueType.Int) {
      let parsedInt = tryParseInt(this.value);
      if (parsedInt.exists) {
        return new IntValue(parsedInt.result);
      } else {
        throw this.BadCastException(newType);
      }
    }

    if (newType == ValueType.Float) {
      let parsedFloat = tryParseFloat(this.value);
      if (parsedFloat.exists) {
        return new FloatValue(parsedFloat.result);
      } else {
        throw this.BadCastException(newType);
      }
    }

    throw this.BadCastException(newType);
  }
}

export class DivertTargetValue extends Value<Path> {
  constructor(targetPath: Path | null = null) {
    super(targetPath);
  }
  public get valueType() {
    return ValueType.DivertTarget;
  }
  public get targetPath() {
    if (this.value === null) return throwNullException("Value.value");
    return this.value;
  }
  public set targetPath(value: Path) {
    this.value = value;
  }
  public get isTruthy(): never {
    throw new Error("Shouldn't be checking the truthiness of a divert target");
  }

  public Cast(newType: ValueType): Value<any> {
    if (newType == this.valueType) return this;

    throw this.BadCastException(newType);
  }
  public toString() {
    return "DivertTargetValue(" + this.targetPath + ")";
  }
}

export class VariablePointerValue extends Value<string> {
  public _contextIndex: number;

  constructor(variableName: string, contextIndex: number = -1) {
    super(variableName);

    this._contextIndex = contextIndex;
  }

  public get contextIndex() {
    return this._contextIndex;
  }
  public set contextIndex(value: number) {
    this._contextIndex = value;
  }
  public get variableName() {
    if (this.value === null) return throwNullException("Value.value");
    return this.value;
  }
  public set variableName(value: string) {
    this.value = value;
  }
  public get valueType() {
    return ValueType.VariablePointer;
  }

  public get isTruthy(): never {
    throw new Error(
      "Shouldn't be checking the truthiness of a variable pointer"
    );
  }

  public Cast(newType: ValueType): Value<any> {
    if (newType == this.valueType) return this;

    throw this.BadCastException(newType);
  }
  public toString() {
    return "VariablePointerValue(" + this.variableName + ")";
  }
  public Copy() {
    return new VariablePointerValue(this.variableName, this.contextIndex);
  }
}

export class ListValue extends Value<InkList> {
  public get isTruthy() {
    if (this.value === null) {
      return throwNullException("this.value");
    }
    return this.value.Count > 0;
  }
  public get valueType() {
    return ValueType.List;
  }
  public Cast(newType: ValueType): Value<any> {
    if (this.value === null) return throwNullException("Value.value");

    if (newType == ValueType.Int) {
      let max = this.value.maxItem;
      if (max.Key.isNull) return new IntValue(0);
      else return new IntValue(max.Value);
    } else if (newType == ValueType.Float) {
      let max = this.value.maxItem;
      if (max.Key.isNull) return new FloatValue(0.0);
      else return new FloatValue(max.Value);
    } else if (newType == ValueType.String) {
      let max = this.value.maxItem;
      if (max.Key.isNull) return new StringValue("");
      else {
        return new StringValue(max.Key.toString());
      }
    }

    if (newType == this.valueType) return this;

    throw this.BadCastException(newType);
  }
  constructor();
  constructor(list: InkList);
  constructor(listOrSingleItem: InkListItem, singleValue: number);
  constructor(listOrSingleItem?: InkListItem | InkList, singleValue?: number) {
    super(null);

    if (!listOrSingleItem && !singleValue) {
      this.value = new InkList();
    } else if (listOrSingleItem instanceof InkList) {
      this.value = new InkList(listOrSingleItem);
    } else if (
      listOrSingleItem instanceof InkListItem &&
      typeof singleValue === "number"
    ) {
      this.value = new InkList({
        Key: listOrSingleItem,
        Value: singleValue,
      });
    }
  }
  public static RetainListOriginsForAssignment(
    oldValue: InkObject | null,
    newValue: InkObject
  ) {
    let oldList = asOrNull(oldValue, ListValue);
    let newList = asOrNull(newValue, ListValue);

    if (newList && newList.value === null)
      return throwNullException("newList.value");
    if (oldList && oldList.value === null)
      return throwNullException("oldList.value");

    // When assigning the empty list, try to retain any initial origin names
    if (oldList && newList && newList.value!.Count == 0)
      newList.value!.SetInitialOriginNames(oldList.value!.originNames);
  }
}

export enum ValueType {
  Bool = -1,
  Int = 0,
  Float = 1,
  List = 2,
  String = 3,
  DivertTarget = 4,
  VariablePointer = 5,
}
