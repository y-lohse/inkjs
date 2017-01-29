//misses delegates, probably the returns from function calls
import {Value, ValueType} from './Value';
import {StoryException} from './StoryException';
import {Void} from './Void';
import {Object as InkObject} from './Object';

export class NativeFunctionCall extends InkObject{
	constructor(name){
		super();
		this.name = name;
		this._numberOfParameters;
		
		this._prototype;
		this._isPrototype;
		this._operationFuncs = null;	
		
		NativeFunctionCall.GenerateNativeFunctionsIfNecessary();
	}
	get name(){
		return this._name;
	}
	set name(value){
		this._name = value;
		if( !this._isPrototype )
			this._prototype = NativeFunctionCall._nativeFunctions[this._name];
	}
	get numberOfParameters(){
		if (this._prototype) {
			return this._prototype.numberOfParameters;
		} else {
			return this._numberOfParameters;
		}
	}
	set numberOfParameters(value){
		this._numberOfParameters = value;
	}
	
	static internalConstructor(name, numberOfParamters){
		var nativeFunc = new NativeFunctionCall(name);
		nativeFunc._isPrototype = true;
		nativeFunc.numberOfParameters = numberOfParamters;
		return nativeFunc;
	}
	static CallWithName(functionName){
		return new NativeFunctionCall(functionName);
	}
	static CallExistsWithName(functionName){
		this.GenerateNativeFunctionsIfNecessary();
		return this._nativeFunctions[functionName];
	}
	Call(parameters){
		if (this._prototype) {
			return this._prototype.Call(parameters);
		}

		if (this.numberOfParameters != parameters.length) {
			throw "Unexpected number of parameters";
		}
		
		var hasList  = false;
		parameters.forEach(p => {
			if (p instanceof Void) throw new StoryException("Attempting to perform operation on a void value. Did you forget to 'return' a value from a function you called here?");
			if (p instanceof ListValue)
				hasList = true;
		});
		
		if (parameters.length == 2 && hasList){
			return this.CallBinaryListOperation(parameters);
		}

		var coercedParams = this.CoerceValuesToSingleType(parameters);
		var coercedType = coercedParams[0].valueType;

		//Originally CallType gets a type parameter that is used to do some casting, but we can do without.
		if (coercedType == ValueType.Int) {
			return this.CallType(coercedParams);
		} else if (coercedType == ValueType.Float) {
			return this.CallType(coercedParams);
		} else if (coercedType == ValueType.String) {
			return this.CallType(coercedParams);
		} else if (coercedType == ValueType.DivertTarget) {
			return this.CallType(coercedParams);
		} else if (coercedType == ValueType.List) {
			return this.CallType(coercedParams);
		}

		return null;
	}
	CallType(parametersOfSingleType){
		var param1 = parametersOfSingleType[0];
		var valType = param1.valueType;

		var val1 = param1;

		var paramCount = parametersOfSingleType.length;

		if (paramCount == 2 || paramCount == 1) {

			var opForTypeObj = this._operationFuncs[valType];
			if (!opForTypeObj) {
				throw new StoryException("Cannot perform operation '"+this.name+"' on "+valType);
			}

			// Binary
			if (paramCount == 2) {
				var param2 = parametersOfSingleType[1];

				var val2 = param2;

				var opForType = opForTypeObj;

				// Return value unknown until it's evaluated
				var resultVal = opForType(val1.value, val2.value);

				return Value.Create(resultVal);
			} 

			// Unary
			else {

				var opForType = opForTypeObj;

				var resultVal = opForType(val1.value);

				return Value.Create(resultVal);
			}  
		}

		else {
			throw "Unexpected number of parameters to NativeFunctionCall: " + parametersOfSingleType.length;
		}
	}
	CallBinaryListOperation(parameters)
	{
		// List-Int addition/subtraction returns a List (e.g. "alpha" + 1 = "beta")
		if ((this.name == "+" || this.name == "-") && parameters[0] instanceof ListValue && parameters[1] instanceof IntValue)
			return CallListIncrementOperation(parameters);

//		var v1 = parameters [0] as Value;
		var v1 = parameters[0];
//		var v2 = parameters [1] as Value;
		var v2 = parameters[1];

		// And/or with any other type requires coerscion to bool (int)
		if ((this.name == "&&" || this.name == "||") && (v1.valueType != ValueType.List || v2.valueType != ValueType.List)) {
//			var op = _operationFuncs [ValueType.Int] as BinaryOp<int>;
			var op = this._operationFuncs[ValueType.Int];
			var result = op(v1.isTruthy ? 1 : 0, v2.isTruthy ? 1 : 0);
			return parseInt(result);
		}

		// Normal (list • list) operation
		if (v1.valueType == ValueType.List && v2.valueType == ValueType.List)
			return CallType([v1, v2]);

		throw new StoryException("Can not call use '" + this.name + "' operation on " + v1.valueType + " and " + v2.valueType);
	}
	CallListIncrementOperation(listIntParams)
	{
		var listVal = listIntParams[0];
		var intVal = listIntParams[1];


		var resultRawList = new RawList();

		listVal.value.forEach(function(listItemWithValue){
			var listItem = listItemWithValue.Key;
			var listItemValue = listItemWithValue.Value;

			// Find + or - operation
			var intOp = this._operationFuncs[ValueType.Int];

			// Return value unknown until it's evaluated
			var targetInt = intOp(listItemValue, intVal.value);

			// Find this item's origin (linear search should be ok, should be short haha)
			var itemOrigin = null;
			listVal.value.origins.forEach(function(origin){
				if (origin.name == listItem.originName) {
					itemOrigin = origin;
					return false;
				}
			});
			if (itemOrigin != null) {
				var incrementedItem = itemOrigin.TryGetItemWithValue(targetInt);
				if (incrementedItem.exists)
					resultRawList.Add(incrementedItem.item, targetInt);
			}
		});

		return new ListValue(resultRawList);
	}
	CoerceValuesToSingleType(parametersIn){
		var valType = ValueType.Int;
		
		var specialCaseList = null;

		// Find out what the output type is
		// "higher level" types infect both so that binary operations
		// use the same type on both sides. e.g. binary operation of
		// int and float causes the int to be casted to a float.
		parametersIn.forEach(obj => {
			var val = obj;
			if (val.valueType > valType) {
				valType = val.valueType;
			}
			
			if (val.valueType == ValueType.List) {
//				 specialCaseList = val as ListValue;
				 specialCaseList = val;
			}
		});

		// Coerce to this chosen type
		var parametersOut = [];
		
		if (valType == ValueType.List) {
			parametersIn.forEach(function(val){
				if (val.valueType == ValueType.List) {
					parametersOut.push(val);
				} else if (val.valueType == ValueType.Int) {
					var intVal = parseInt(val.valueObject);
					var list = specialCaseList.value.originOfMaxItem;

					var item = list.TryGetItemWithValue(intVal);
					if (item.exists) {
						var castedValue = new ListValue(item.item, intVal);
						parametersOut.push(castedValue);
					} else
						throw new StoryException("Could not find List item with the value " + intVal + " in " + list.name);
				} else
					throw new StoryException("Cannot mix Lists and " + val.valueType + " values in this operation");
			});
		} 

		// Normal Coercing (with standard casting)
		else {
			parametersIn.forEach(function(val){
				var castedValue = val.Cast(valType);
				parametersOut.push(castedValue);
			});
		}

		return parametersOut;
	}
	static GenerateNativeFunctionsIfNecessary(){
		if (this._nativeFunctions == null) {
			this._nativeFunctions = {};

			// Int operations
			this.AddIntBinaryOp(this.Add,      (x, y) => {return x + y});
			this.AddIntBinaryOp(this.Subtract, (x, y) => {return x - y});
			this.AddIntBinaryOp(this.Multiply, (x, y) => {return x * y});
			this.AddIntBinaryOp(this.Divide,   (x, y) => {return parseInt(x / y)});
			this.AddIntBinaryOp(this.Mod,      (x, y) => {return x % y}); 
			this.AddIntUnaryOp(this.Negate,   x => {return -x}); 

			this.AddIntBinaryOp(this.Equal,    (x, y) => {return x == y ? 1 : 0});
			this.AddIntBinaryOp(this.Greater,  (x, y) => {return x > y  ? 1 : 0});
			this.AddIntBinaryOp(this.Less,     (x, y) => {return x < y  ? 1 : 0});
			this.AddIntBinaryOp(this.GreaterThanOrEquals, (x, y) => {return x >= y ? 1 : 0});
			this.AddIntBinaryOp(this.LessThanOrEquals, (x, y) => {return x <= y ? 1 : 0});
			this.AddIntBinaryOp(this.NotEquals, (x, y) => {return x != y ? 1 : 0});
			this.AddIntUnaryOp(this.Not,       x => {return (x == 0) ? 1 : 0}); 

			this.AddIntBinaryOp(this.And,      (x, y) => {return x != 0 && y != 0 ? 1 : 0});
			this.AddIntBinaryOp(this.Or,       (x, y) => {return x != 0 || y != 0 ? 1 : 0});

			this.AddIntBinaryOp(this.Max,      (x, y) => {return Math.max(x, y)});
			this.AddIntBinaryOp(this.Min,      (x, y) => {return Math.min(x, y)});

			// Float operations
			this.AddFloatBinaryOp(this.Add,      (x, y) => {return x + y});
			this.AddFloatBinaryOp(this.Subtract, (x, y) => {return x - y});
			this.AddFloatBinaryOp(this.Multiply, (x, y) => {return x * y});
			this.AddFloatBinaryOp(this.Divide,   (x, y) => {return x / y});
			this.AddFloatBinaryOp(this.Mod,      (x, y) => {return x % y}); // TODO: Is this the operation we want for floats?
			this.AddFloatUnaryOp(this.Negate,   x => {return -x}); 

			this.AddFloatBinaryOp(this.Equal,    (x, y) => {return x == y ? 1 : 0});
			this.AddFloatBinaryOp(this.Greater,  (x, y) => {return x > y  ? 1 : 0});
			this.AddFloatBinaryOp(this.Less,     (x, y) => {return x < y  ? 1 : 0});
			this.AddFloatBinaryOp(this.GreaterThanOrEquals, (x, y) => {return x >= y ? 1 : 0});
			this.AddFloatBinaryOp(this.LessThanOrEquals, (x, y) => {return x <= y ? 1 : 0});
			this.AddFloatBinaryOp(this.NotEquals, (x, y) => {return x != y ? 1 : 0});
			this.AddFloatUnaryOp(this.Not,       x => {return (x == 0.0) ? 1 : 0}); 

			this.AddFloatBinaryOp(this.And,      (x, y) => {return x != 0.0 && y != 0.0 ? 1 : 0});
			this.AddFloatBinaryOp(this.Or,       (x, y) => {return x != 0.0 || y != 0.0 ? 1 : 0});

			this.AddFloatBinaryOp(this.Max,      (x, y) => {return Math.max(x, y)});
			this.AddFloatBinaryOp(this.Min,      (x, y) => {return Math.min(x, y)});

			// String operations
			this.AddStringBinaryOp(this.Add,     (x, y) => {return x + y}); // concat
			this.AddStringBinaryOp(this.Equal,   (x, y) => {return x === y ? 1 : 0});
			
			this.AddListBinaryOp(this.Add, 		 (x, y) => {return x.Union(y)});
			this.AddListBinaryOp(this.And, 		 (x, y) => {return x.Union(y)});
			this.AddListBinaryOp(this.Subtract,  (x, y) => {return x.Without(y)});
			this.AddListBinaryOp(this.Has, 		 (x, y) => {return x.Contains(y) ? 1 : 0});
			this.AddListBinaryOp(this.Hasnt, 	 (x, y) => {return x.Contains(y) ? 0 : 1});
			this.AddListBinaryOp(this.Intersect, (x, y) => {return x.Intersect(y)});
			
			this.AddListBinaryOp(this.Equal, 				(x, y) => {return x.Equals(y) ? 1 : 0});
			this.AddListBinaryOp(this.Greater, 				(x, y) => {return x.GreaterThan(y) ? 1 : 0});
			this.AddListBinaryOp(this.Less, 				(x, y) => {return x.LessThan(y) ? 1 : 0});
			this.AddListBinaryOp(this.GreaterThanOrEquals, 	(x, y) => {return x.GreaterThanOrEquals(y) ? 1 : 0});
			this.AddListBinaryOp(this.LessThanOrEquals, 	(x, y) => {return x.LessThanOrEquals(y) ? 1 : 0});
			this.AddListBinaryOp(this.NotEquals, 			(x, y) => {return !x.Equals(y) ? 1 : 0});
			
			this.AddListUnaryOp(this.Not, (x) => {return x.Count == 0 ? 1 : 0});

			this.AddListUnaryOp(this.Invert, (x) => {return x.inverse});
			this.AddListUnaryOp(this.All, (x) => {return x.all});
			this.AddListUnaryOp(this.ListMin, (x) => {return x.MinAsList()});
			this.AddListUnaryOp(this.ListMax, (x) => {return x.MaxAsList()});
			this.AddListUnaryOp(this.Count,  (x) => {return x.Count});
			this.AddListUnaryOp(this.ValueOfList,  (x) => {return x.maxItem.Value});

			// Special case: The only operation you can do on divert target values
			var divertTargetsEqual = (d1, d2) => {
				return d1.Equals(d2) ? 1 : 0;
			};
			this.AddOpToNativeFunc(this.Equal, 2, ValueType.DivertTarget, divertTargetsEqual);
		}
	}
	AddOpFuncForType(valType, op){
		if (this._operationFuncs == null) {
			this._operationFuncs = {};
		}

		this._operationFuncs[valType] = op;
	}
	static AddOpToNativeFunc(name, args, valType, op){
		var nativeFunc = this._nativeFunctions[name];
		if (!nativeFunc) {
			nativeFunc = NativeFunctionCall.internalConstructor(name, args);
			this._nativeFunctions[name] = nativeFunc;
		}

		nativeFunc.AddOpFuncForType(valType, op);
	}
	
	static AddIntBinaryOp(name, op){
		this.AddOpToNativeFunc(name, 2, ValueType.Int, op);
	}
	static AddIntUnaryOp(name, op){
		this.AddOpToNativeFunc(name, 1, ValueType.Int, op);
	}
	
	static AddFloatBinaryOp(name, op){
		this.AddOpToNativeFunc(name, 2, ValueType.Float, op);
	}
	static AddFloatUnaryOp(name, op){
		this.AddOpToNativeFunc(name, 1, ValueType.Float, op);
	}
	
	static AddStringBinaryOp(name, op){
		this.AddOpToNativeFunc(name, 2, ValueType.String, op);
	}
	
	static AddListBinaryOp(name, op){
		this.AddOpToNativeFunc(name, 2, ValueType.List, op);
	}
	static AddListUnaryOp(name, op){
		this.AddOpToNativeFunc(name, 1, ValueType.List, op);
	}
	
	toString(){
		return "Native '" + this.name + "'";
	}
}

NativeFunctionCall.Add 		= "+";
NativeFunctionCall.Subtract = "-";
NativeFunctionCall.Divide   = "/";
NativeFunctionCall.Multiply = "*";
NativeFunctionCall.Mod      = "%";
NativeFunctionCall.Negate   = "_";

NativeFunctionCall.Equal    = "==";
NativeFunctionCall.Greater  = ">";
NativeFunctionCall.Less     = "<";
NativeFunctionCall.GreaterThanOrEquals = ">=";
NativeFunctionCall.LessThanOrEquals = "<=";
NativeFunctionCall.NotEquals   = "!=";
NativeFunctionCall.Not      = "!";

NativeFunctionCall.And      = "&&";
NativeFunctionCall.Or       = "||";

NativeFunctionCall.Min      = "MIN";
NativeFunctionCall.Max      = "MAX";

NativeFunctionCall.Has      = "?";
NativeFunctionCall.Hasnt    = "!?";
NativeFunctionCall.Intersect = "^";

NativeFunctionCall.ListMin   = "LIST_MIN";
NativeFunctionCall.ListMax   = "LIST_MAX";
NativeFunctionCall.All       = "LIST_ALL";
NativeFunctionCall.Count     = "LIST_COUNT";
NativeFunctionCall.ValueOfList = "LIST_VALUE";
NativeFunctionCall.Invert    = "LIST_INVERT";

NativeFunctionCall._nativeFunctions = null;