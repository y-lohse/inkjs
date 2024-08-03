import { Value, ValueType, IntValue, ListValue, BoolValue } from "./Value";
import { StoryException } from "./StoryException";
import { Void } from "./Void";
import { Path } from "./Path";
import { InkList, InkListItem } from "./InkList";
import { InkObject } from "./Object";
import { asOrNull, asOrThrows, asBooleanOrThrows } from "./TypeAssertion";
import { throwNullException } from "./NullException";

type BinaryOp<T> = (left: T, right: T) => any;
type UnaryOp<T> = (val: T) => any;

export class NativeFunctionCall extends InkObject {
  public static readonly Add: string = "+";
  public static readonly Subtract: string = "-";
  public static readonly Divide: string = "/";
  public static readonly Multiply: string = "*";
  public static readonly Mod: string = "%";
  public static readonly Negate: string = "_";
  public static readonly Equal: string = "==";
  public static readonly Greater: string = ">";
  public static readonly Less: string = "<";
  public static readonly GreaterThanOrEquals: string = ">=";
  public static readonly LessThanOrEquals: string = "<=";
  public static readonly NotEquals: string = "!=";
  public static readonly Not: string = "!";
  public static readonly And: string = "&&";
  public static readonly Or: string = "||";
  public static readonly Min: string = "MIN";
  public static readonly Max: string = "MAX";
  public static readonly Pow: string = "POW";
  public static readonly Floor: string = "FLOOR";
  public static readonly Ceiling: string = "CEILING";
  public static readonly Int: string = "INT";
  public static readonly Float: string = "FLOAT";
  public static readonly Has: string = "?";
  public static readonly Hasnt: string = "!?";
  public static readonly Intersect: string = "^";
  public static readonly ListMin: string = "LIST_MIN";
  public static readonly ListMax: string = "LIST_MAX";
  public static readonly All: string = "LIST_ALL";
  public static readonly Count: string = "LIST_COUNT";
  public static readonly ValueOfList: string = "LIST_VALUE";
  public static readonly Invert: string = "LIST_INVERT";

  public static CallWithName(functionName: string) {
    return new NativeFunctionCall(functionName);
  }

  public static CallExistsWithName(functionName: string) {
    this.GenerateNativeFunctionsIfNecessary();
    return this._nativeFunctions!.get(functionName);
  }

  get name() {
    if (this._name === null)
      return throwNullException("NativeFunctionCall._name");
    return this._name;
  }
  set name(value: string) {
    this._name = value;
    if (!this._isPrototype) {
      if (NativeFunctionCall._nativeFunctions === null)
        throwNullException("NativeFunctionCall._nativeFunctions");
      else
        this._prototype =
          NativeFunctionCall._nativeFunctions.get(this._name) || null;
    }
  }
  public _name: string | null = null;

  get numberOfParameters() {
    if (this._prototype) {
      return this._prototype.numberOfParameters;
    } else {
      return this._numberOfParameters;
    }
  }
  set numberOfParameters(value: number) {
    this._numberOfParameters = value;
  }
  public _numberOfParameters: number = 0;

  public Call(parameters: InkObject[]): InkObject | null {
    if (this._prototype) {
      return this._prototype.Call(parameters);
    }

    if (this.numberOfParameters != parameters.length) {
      throw new Error("Unexpected number of parameters");
    }

    let hasList = false;
    for (let p of parameters) {
      if (p instanceof Void)
        throw new StoryException(
          "Attempting to perform " +
            this.name +
            ' on a void value. Did you forget to "return" a value from a function you called here?'
        );
      if (p instanceof ListValue) hasList = true;
    }

    if (parameters.length == 2 && hasList) {
      return this.CallBinaryListOperation(parameters);
    }

    let coercedParams = this.CoerceValuesToSingleType(parameters);
    let coercedType = coercedParams[0].valueType;

    if (coercedType == ValueType.Int) {
      return this.CallType<number>(coercedParams);
    } else if (coercedType == ValueType.Float) {
      return this.CallType<number>(coercedParams);
    } else if (coercedType == ValueType.String) {
      return this.CallType<string>(coercedParams);
    } else if (coercedType == ValueType.DivertTarget) {
      return this.CallType<Path>(coercedParams);
    } else if (coercedType == ValueType.List) {
      return this.CallType<InkList>(coercedParams);
    }

    return null;
  }

  public CallType<T extends { toString: () => string }>(
    parametersOfSingleType: Array<Value<T>>
  ) {
    let param1 = asOrThrows(parametersOfSingleType[0], Value);
    let valType = param1.valueType;

    let val1 = param1 as Value<T>;

    let paramCount = parametersOfSingleType.length;

    if (paramCount == 2 || paramCount == 1) {
      if (this._operationFuncs === null)
        return throwNullException("NativeFunctionCall._operationFuncs");
      let opForTypeObj = this._operationFuncs.get(valType);
      if (!opForTypeObj) {
        const key = ValueType[valType];
        throw new StoryException(
          "Cannot perform operation " + this.name + " on " + key
        );
      }

      if (paramCount == 2) {
        let param2 = asOrThrows(parametersOfSingleType[1], Value);

        let val2 = param2 as Value<T>;

        let opForType = opForTypeObj as BinaryOp<T>;

        if (val1.value === null || val2.value === null)
          return throwNullException("NativeFunctionCall.Call BinaryOp values");
        let resultVal = opForType(val1.value, val2.value);

        return Value.Create(resultVal);
      } else {
        let opForType = opForTypeObj as UnaryOp<T>;

        if (val1.value === null)
          return throwNullException("NativeFunctionCall.Call UnaryOp value");
        let resultVal = opForType(val1.value);

        // This code is different from upstream. Since JavaScript treats
        // integers and floats as the same numbers, it's impossible
        // to force an number to be either an integer or a float.
        //
        // It can be useful to force a specific number type
        // (especially for divisions), so the result of INT() & FLOAT()
        // is coerced to the the proper value type.
        //
        // Note that we also force all other unary operation to
        // return the same value type, although this is only
        // meaningful for numbers. See `Value.Create`.
        if (this.name === NativeFunctionCall.Int) {
          return Value.Create(resultVal, ValueType.Int);
        } else if (this.name === NativeFunctionCall.Float) {
          return Value.Create(resultVal, ValueType.Float);
        } else {
          return Value.Create(resultVal, param1.valueType);
        }
      }
    } else {
      throw new Error(
        "Unexpected number of parameters to NativeFunctionCall: " +
          parametersOfSingleType.length
      );
    }
  }

  public CallBinaryListOperation(parameters: InkObject[]) {
    if (
      (this.name == "+" || this.name == "-") &&
      parameters[0] instanceof ListValue &&
      parameters[1] instanceof IntValue
    )
      return this.CallListIncrementOperation(parameters);

    let v1 = asOrThrows(parameters[0], Value);
    let v2 = asOrThrows(parameters[1], Value);

    if (
      (this.name == "&&" || this.name == "||") &&
      (v1.valueType != ValueType.List || v2.valueType != ValueType.List)
    ) {
      if (this._operationFuncs === null)
        return throwNullException("NativeFunctionCall._operationFuncs");
      let op = this._operationFuncs.get(ValueType.Int) as BinaryOp<number>;
      if (op === null)
        return throwNullException(
          "NativeFunctionCall.CallBinaryListOperation op"
        );
      let result = asBooleanOrThrows(
        op(v1.isTruthy ? 1 : 0, v2.isTruthy ? 1 : 0)
      );
      return new BoolValue(result);
    }

    if (v1.valueType == ValueType.List && v2.valueType == ValueType.List)
      return this.CallType<InkList>([v1, v2]);

    throw new StoryException(
      "Can not call use " +
        this.name +
        " operation on " +
        ValueType[v1.valueType] +
        " and " +
        ValueType[v2.valueType]
    );
  }

  public CallListIncrementOperation(listIntParams: InkObject[]) {
    let listVal = asOrThrows(listIntParams[0], ListValue);
    let intVal = asOrThrows(listIntParams[1], IntValue);

    let resultInkList = new InkList();

    if (listVal.value === null)
      return throwNullException(
        "NativeFunctionCall.CallListIncrementOperation listVal.value"
      );
    for (let [listItemKey, listItemValue] of listVal.value) {
      let listItem = InkListItem.fromSerializedKey(listItemKey);

      if (this._operationFuncs === null)
        return throwNullException("NativeFunctionCall._operationFuncs");
      let intOp = this._operationFuncs.get(ValueType.Int) as BinaryOp<number>;

      if (intVal.value === null)
        return throwNullException(
          "NativeFunctionCall.CallListIncrementOperation intVal.value"
        );
      let targetInt = intOp(listItemValue, intVal.value);

      let itemOrigin = null;
      if (listVal.value.origins === null)
        return throwNullException(
          "NativeFunctionCall.CallListIncrementOperation listVal.value.origins"
        );
      for (let origin of listVal.value.origins) {
        if (origin.name == listItem.originName) {
          itemOrigin = origin;
          break;
        }
      }
      if (itemOrigin != null) {
        let incrementedItem = itemOrigin.TryGetItemWithValue(
          targetInt,
          InkListItem.Null
        );
        if (incrementedItem.exists)
          resultInkList.Add(incrementedItem.result, targetInt);
      }
    }

    return new ListValue(resultInkList);
  }

  public CoerceValuesToSingleType(parametersIn: InkObject[]) {
    let valType = ValueType.Int;

    let specialCaseList: null | ListValue = null;

    for (let obj of parametersIn) {
      let val = asOrThrows(obj, Value);
      if (val.valueType > valType) {
        valType = val.valueType;
      }

      if (val.valueType == ValueType.List) {
        specialCaseList = asOrNull(val, ListValue);
      }
    }

    let parametersOut = [];

    if (ValueType[valType] == ValueType[ValueType.List]) {
      for (let inkObjectVal of parametersIn) {
        let val = asOrThrows(inkObjectVal, Value);
        if (val.valueType == ValueType.List) {
          parametersOut.push(val);
        } else if (val.valueType == ValueType.Int) {
          let intVal = parseInt(val.valueObject);

          specialCaseList = asOrThrows(specialCaseList, ListValue);
          if (specialCaseList.value === null)
            return throwNullException(
              "NativeFunctionCall.CoerceValuesToSingleType specialCaseList.value"
            );
          let list = specialCaseList.value.originOfMaxItem;

          if (list === null)
            return throwNullException(
              "NativeFunctionCall.CoerceValuesToSingleType list"
            );
          let item = list.TryGetItemWithValue(intVal, InkListItem.Null);
          if (item.exists) {
            let castedValue = new ListValue(item.result, intVal);
            parametersOut.push(castedValue);
          } else
            throw new StoryException(
              "Could not find List item with the value " +
                intVal +
                " in " +
                list.name
            );
        } else {
          const key = ValueType[val.valueType];
          throw new StoryException(
            "Cannot mix Lists and " + key + " values in this operation"
          );
        }
      }
    } else {
      for (let inkObjectVal of parametersIn) {
        let val = asOrThrows(inkObjectVal, Value);
        let castedValue = val.Cast(valType);
        parametersOut.push(castedValue);
      }
    }

    return parametersOut;
  }

  constructor(name: string);
  constructor(name: string, numberOfParameters: number);
  constructor();
  constructor() {
    super();

    if (arguments.length === 0) {
      NativeFunctionCall.GenerateNativeFunctionsIfNecessary();
    } else if (arguments.length === 1) {
      let name = arguments[0];
      NativeFunctionCall.GenerateNativeFunctionsIfNecessary();
      this.name = name;
    } else if (arguments.length === 2) {
      let name = arguments[0];
      let numberOfParameters = arguments[1];

      this._isPrototype = true;
      this.name = name;
      this.numberOfParameters = numberOfParameters;
    }
  }

  public static Identity<T>(t: T): any {
    return t;
  }

  public static GenerateNativeFunctionsIfNecessary() {
    if (this._nativeFunctions == null) {
      this._nativeFunctions = new Map();

      // Int operations
      this.AddIntBinaryOp(this.Add, (x, y) => x + y);
      this.AddIntBinaryOp(this.Subtract, (x, y) => x - y);
      this.AddIntBinaryOp(this.Multiply, (x, y) => x * y);
      this.AddIntBinaryOp(this.Divide, (x, y) => Math.floor(x / y));
      this.AddIntBinaryOp(this.Mod, (x, y) => x % y);
      this.AddIntUnaryOp(this.Negate, (x) => -x);

      this.AddIntBinaryOp(this.Equal, (x, y) => x == y);
      this.AddIntBinaryOp(this.Greater, (x, y) => x > y);
      this.AddIntBinaryOp(this.Less, (x, y) => x < y);
      this.AddIntBinaryOp(this.GreaterThanOrEquals, (x, y) => x >= y);
      this.AddIntBinaryOp(this.LessThanOrEquals, (x, y) => x <= y);
      this.AddIntBinaryOp(this.NotEquals, (x, y) => x != y);
      this.AddIntUnaryOp(this.Not, (x) => x == 0);

      this.AddIntBinaryOp(this.And, (x, y) => x != 0 && y != 0);
      this.AddIntBinaryOp(this.Or, (x, y) => x != 0 || y != 0);

      this.AddIntBinaryOp(this.Max, (x, y) => Math.max(x, y));
      this.AddIntBinaryOp(this.Min, (x, y) => Math.min(x, y));

      this.AddIntBinaryOp(this.Pow, (x, y) => Math.pow(x, y));
      this.AddIntUnaryOp(this.Floor, NativeFunctionCall.Identity);
      this.AddIntUnaryOp(this.Ceiling, NativeFunctionCall.Identity);
      this.AddIntUnaryOp(this.Int, NativeFunctionCall.Identity);
      this.AddIntUnaryOp(this.Float, (x) => x);

      // Float operations
      this.AddFloatBinaryOp(this.Add, (x, y) => x + y);
      this.AddFloatBinaryOp(this.Subtract, (x, y) => x - y);
      this.AddFloatBinaryOp(this.Multiply, (x, y) => x * y);
      this.AddFloatBinaryOp(this.Divide, (x, y) => x / y);
      this.AddFloatBinaryOp(this.Mod, (x, y) => x % y);
      this.AddFloatUnaryOp(this.Negate, (x) => -x);

      this.AddFloatBinaryOp(this.Equal, (x, y) => x == y);
      this.AddFloatBinaryOp(this.Greater, (x, y) => x > y);
      this.AddFloatBinaryOp(this.Less, (x, y) => x < y);
      this.AddFloatBinaryOp(this.GreaterThanOrEquals, (x, y) => x >= y);
      this.AddFloatBinaryOp(this.LessThanOrEquals, (x, y) => x <= y);
      this.AddFloatBinaryOp(this.NotEquals, (x, y) => x != y);
      this.AddFloatUnaryOp(this.Not, (x) => x == 0.0);

      this.AddFloatBinaryOp(this.And, (x, y) => x != 0.0 && y != 0.0);
      this.AddFloatBinaryOp(this.Or, (x, y) => x != 0.0 || y != 0.0);

      this.AddFloatBinaryOp(this.Max, (x, y) => Math.max(x, y));
      this.AddFloatBinaryOp(this.Min, (x, y) => Math.min(x, y));

      this.AddFloatBinaryOp(this.Pow, (x, y) => Math.pow(x, y));
      this.AddFloatUnaryOp(this.Floor, (x) => Math.floor(x));
      this.AddFloatUnaryOp(this.Ceiling, (x) => Math.ceil(x));
      this.AddFloatUnaryOp(this.Int, (x) => Math.floor(x));
      this.AddFloatUnaryOp(this.Float, NativeFunctionCall.Identity);

      // String operations
      this.AddStringBinaryOp(this.Add, (x, y) => x + y); // concat
      this.AddStringBinaryOp(this.Equal, (x, y) => x === y);
      this.AddStringBinaryOp(this.NotEquals, (x, y) => !(x === y));
      this.AddStringBinaryOp(this.Has, (x, y) => x.includes(y));
      this.AddStringBinaryOp(this.Hasnt, (x, y) => !x.includes(y));

      this.AddListBinaryOp(this.Add, (x, y) => x.Union(y));
      this.AddListBinaryOp(this.Subtract, (x, y) => x.Without(y));
      this.AddListBinaryOp(this.Has, (x, y) => x.Contains(y));
      this.AddListBinaryOp(this.Hasnt, (x, y) => !x.Contains(y));
      this.AddListBinaryOp(this.Intersect, (x, y) => x.Intersect(y));

      this.AddListBinaryOp(this.Equal, (x, y) => x.Equals(y));
      this.AddListBinaryOp(this.Greater, (x, y) => x.GreaterThan(y));
      this.AddListBinaryOp(this.Less, (x, y) => x.LessThan(y));
      this.AddListBinaryOp(this.GreaterThanOrEquals, (x, y) =>
        x.GreaterThanOrEquals(y)
      );
      this.AddListBinaryOp(this.LessThanOrEquals, (x, y) =>
        x.LessThanOrEquals(y)
      );
      this.AddListBinaryOp(this.NotEquals, (x, y) => !x.Equals(y));

      this.AddListBinaryOp(this.And, (x, y) => x.Count > 0 && y.Count > 0);
      this.AddListBinaryOp(this.Or, (x, y) => x.Count > 0 || y.Count > 0);

      this.AddListUnaryOp(this.Not, (x) => (x.Count == 0 ? 1 : 0));

      this.AddListUnaryOp(this.Invert, (x) => x.inverse);
      this.AddListUnaryOp(this.All, (x) => x.all);
      this.AddListUnaryOp(this.ListMin, (x) => x.MinAsList());
      this.AddListUnaryOp(this.ListMax, (x) => x.MaxAsList());
      this.AddListUnaryOp(this.Count, (x) => x.Count);
      this.AddListUnaryOp(this.ValueOfList, (x) => x.maxItem.Value);

      let divertTargetsEqual = (d1: Path, d2: Path) => d1.Equals(d2);
      let divertTargetsNotEqual = (d1: Path, d2: Path) => !d1.Equals(d2);
      this.AddOpToNativeFunc(
        this.Equal,
        2,
        ValueType.DivertTarget,
        divertTargetsEqual
      );
      this.AddOpToNativeFunc(
        this.NotEquals,
        2,
        ValueType.DivertTarget,
        divertTargetsNotEqual
      );
    }
  }

  public AddOpFuncForType(
    valType: ValueType,
    op: UnaryOp<number | InkList> | BinaryOp<number | string | InkList | Path>
  ): void {
    if (this._operationFuncs == null) {
      this._operationFuncs = new Map();
    }

    this._operationFuncs.set(valType, op);
  }

  public static AddOpToNativeFunc(
    name: string,
    args: number,
    valType: ValueType,
    op: UnaryOp<any> | BinaryOp<any>
  ): void {
    if (this._nativeFunctions === null)
      return throwNullException("NativeFunctionCall._nativeFunctions");
    let nativeFunc = this._nativeFunctions.get(name);
    if (!nativeFunc) {
      nativeFunc = new NativeFunctionCall(name, args);
      this._nativeFunctions.set(name, nativeFunc);
    }

    nativeFunc.AddOpFuncForType(valType, op);
  }

  public static AddIntBinaryOp(name: string, op: BinaryOp<number>) {
    this.AddOpToNativeFunc(name, 2, ValueType.Int, op);
  }
  public static AddIntUnaryOp(name: string, op: UnaryOp<number>) {
    this.AddOpToNativeFunc(name, 1, ValueType.Int, op);
  }

  public static AddFloatBinaryOp(name: string, op: BinaryOp<number>) {
    this.AddOpToNativeFunc(name, 2, ValueType.Float, op);
  }
  public static AddFloatUnaryOp(name: string, op: UnaryOp<number>) {
    this.AddOpToNativeFunc(name, 1, ValueType.Float, op);
  }

  public static AddStringBinaryOp(name: string, op: BinaryOp<string>) {
    this.AddOpToNativeFunc(name, 2, ValueType.String, op);
  }

  public static AddListBinaryOp(name: string, op: BinaryOp<InkList>) {
    this.AddOpToNativeFunc(name, 2, ValueType.List, op);
  }
  public static AddListUnaryOp(name: string, op: UnaryOp<InkList>) {
    this.AddOpToNativeFunc(name, 1, ValueType.List, op);
  }

  public toString() {
    return 'Native "' + this.name + '"';
  }

  public _prototype: NativeFunctionCall | null = null;
  public _isPrototype: boolean = false;
  public _operationFuncs: Map<ValueType, BinaryOp<any> | UnaryOp<any>> | null =
    null;
  public static _nativeFunctions: Map<string, NativeFunctionCall> | null = null;
}
