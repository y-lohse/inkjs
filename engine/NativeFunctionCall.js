//misses delegates, probably the returns from function calls
import {ValueType} from './Value';
import {Object as InkObject} from './Object';

export class NativeFunctionCall extends InkObject{
	constructor(name){
		super();
		this._name = name;
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
			this._prototype = this._nativeFunctions[this._name];
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
		
//		console.log(parameters);
		parameters.forEach(p => {
			if (p instanceof Void) throw "Attempting to perform operation on a void value. Did you forget to 'return' a value from a function you called here?";
		})

		var coercedParams = this.CoerceValuesToSingleType(parameters);
		var coercedType = coercedParams[0].valueType;

		if (coercedType == ValueType.Int) {
			return Call<int> (coercedParams);
		} else if (coercedType == ValueType.Float) {
			return Call<float> (coercedParams);
		} else if (coercedType == ValueType.String) {
			return Call<string> (coercedParams);
		} else if (coercedType == ValueType.DivertTarget) {
			return Call<Path> (coercedParams);
		}

		return null;
	}
	CallType(parametersOfSingleType){
		var param1 = parametersOfSingleType[0];
		var valType = param1.valueType;

		var val1 = param1;

		var paramCount = parametersOfSingleType.length;

		if (paramCount == 2 || paramCount == 1) {

			var opForTypeObj = _operationFuncs[valType];
			if (!opForTypeObj) {
				throw "Can not perform operation '"+this.name+"' on "+valType;
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
	CoerceValuesToSingleType(parametersIn){
		var valType = ValueType.Int;

		// Find out what the output type is
		// "higher level" types infect both so that binary operations
		// use the same type on both sides. e.g. binary operation of
		// int and float causes the int to be casted to a float.
		parametersIn.forEach(obj => {
			var val = obj;
			if (val.valueType > valType) {
				valType = val.valueType;
			}
		});

		// Coerce to this chosen type
		var parametersOut = [];
		parametersIn.forEach(val => {
			var castedValue = val.Cast(valType);
			parametersOut.push(castedValue);
		});

		return parametersOut;
	}
	static GenerateNativeFunctionsIfNecessary(){
		if (this._nativeFunctions == null) {
			this._nativeFunctions = {};

			// Int operations
			this.AddIntBinaryOp(this.Add,      (x, y) => {x + y});
			this.AddIntBinaryOp(this.Subtract, (x, y) => {x - y});
			this.AddIntBinaryOp(this.Multiply, (x, y) => {x * y});
			this.AddIntBinaryOp(this.Divide,   (x, y) => {x / y});
			this.AddIntBinaryOp(this.Mod,      (x, y) => {x % y}); 
			this.AddIntUnaryOp(this.Negate,   x => {-x}); 

			this.AddIntBinaryOp(this.Equal,    (x, y) => {x == y ? 1 : 0});
			this.AddIntBinaryOp(this.Greater,  (x, y) => {x > y  ? 1 : 0});
			this.AddIntBinaryOp(this.Less,     (x, y) => {x < y  ? 1 : 0});
			this.AddIntBinaryOp(this.GreaterThanOrEquals, (x, y) => {x >= y ? 1 : 0});
			this.AddIntBinaryOp(this.LessThanOrEquals, (x, y) => {x <= y ? 1 : 0});
			this.AddIntBinaryOp(this.NotEquals, (x, y) => {x != y ? 1 : 0});
			this.AddIntUnaryOp(this.Not,       x => {(x == 0) ? 1 : 0}); 

			this.AddIntBinaryOp(this.And,      (x, y) => {x != 0 && y != 0 ? 1 : 0});
			this.AddIntBinaryOp(this.Or,       (x, y) => {x != 0 || y != 0 ? 1 : 0});

			this.AddIntBinaryOp(this.Max,      (x, y) => {Math.max(x, y)});
			this.AddIntBinaryOp(this.Min,      (x, y) => {Math.min(x, y)});

			// Float operations
			this.AddFloatBinaryOp(this.Add,      (x, y) => {x + y});
			this.AddFloatBinaryOp(this.Subtract, (x, y) => {x - y});
			this.AddFloatBinaryOp(this.Multiply, (x, y) => {x * y});
			this.AddFloatBinaryOp(this.Divide,   (x, y) => {x / y});
			this.AddFloatBinaryOp(this.Mod,      (x, y) => {x % y}); // TODO: Is this the operation we want for floats?
			this.AddFloatUnaryOp(this.Negate,   x => {-x}); 

			this.AddFloatBinaryOp(this.Equal,    (x, y) => {x == y ? 1 : 0});
			this.AddFloatBinaryOp(this.Greater,  (x, y) => {x > y  ? 1 : 0});
			this.AddFloatBinaryOp(this.Less,     (x, y) => {x < y  ? 1 : 0});
			this.AddFloatBinaryOp(this.GreaterThanOrEquals, (x, y) => {x >= y ? 1 : 0});
			this.AddFloatBinaryOp(this.LessThanOrEquals, (x, y) => {x <= y ? 1 : 0});
			this.AddFloatBinaryOp(this.NotEquals, (x, y) => {x != y ? 1 : 0});
			this.AddFloatUnaryOp(this.Not,       x => {(x == 0.0) ? 1 : 0}); 

			this.AddFloatBinaryOp(this.And,      (x, y) => {x != 0.0 && y != 0.0 ? 1 : 0});
			this.AddFloatBinaryOp(this.Or,       (x, y) => {x != 0.0 || y != 0.0 ? 1 : 0});

			this.AddFloatBinaryOp(this.Max,      (x, y) => {Math.max(x, y)});
			this.AddFloatBinaryOp(this.Min,      (x, y) => {Math.min(x, y)});

			// String operations
			this.AddStringBinaryOp(this.Add,     (x, y) => {x + y}); // concat
			this.AddStringBinaryOp(this.Equal,   (x, y) => {x === y ? 1 : 0});

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
	
	toString(){
		return "Native '" + this.name + "'";
	}
}

NativeFunctionCall.Add 		= "+";
NativeFunctionCall.Subtract = "-";
NativeFunctionCall.Divide   = "/";
NativeFunctionCall.Multiply = "*";
NativeFunctionCall.Mod      = "%";
NativeFunctionCall.Negate   = "~";

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

NativeFunctionCall._nativeFunctions = null;