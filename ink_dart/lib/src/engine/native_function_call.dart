import 'dart:math' as math;

import 'ink_object.dart';
import 'value.dart';
import 'ink_list.dart';

/// Built-in native function call in the Ink runtime.
///
/// Handles arithmetic, comparison, logic, and list operations.
class NativeFunctionCall extends InkObject {
  String _name;
  int _numberOfParameters = 0;
  NativeFunctionCall? _prototype;
  bool _isPrototype = false;

  NativeFunctionCall(this._name) {
    // Look up the prototype from cached functions
    _initialize();
    if (!_isPrototype && _nativeFunctions.containsKey(_name)) {
      _prototype = _nativeFunctions[_name];
    }
  }

  /// Create a prototype instance (used only during initialization).
  NativeFunctionCall._prototype(this._name) : _isPrototype = true;

  /// The name of this function.
  String get name => _name;

  /// Number of parameters this function takes.
  int get numberOfParameters => _prototype?.numberOfParameters ?? _numberOfParameters;

  /// Static registry of native functions.
  static final Map<String, NativeFunctionCall> _nativeFunctions = {};

  /// Initialize native functions.
  static void _initialize() {
    if (_nativeFunctions.isNotEmpty) return;

    // Arithmetic
    _addBinaryOp('+', (a, b) => _add(a, b));
    _addBinaryOp('-', (a, b) => _subtract(a, b));
    _addBinaryOp('*', (a, b) => _multiply(a, b));
    _addBinaryOp('/', (a, b) => _divide(a, b));
    _addBinaryOp('%', (a, b) => _mod(a, b));
    _addUnaryOp('_', (a) => _negate(a));

    // Comparison
    _addBinaryOp('==', (a, b) => BoolValue(_equals(a, b)));
    _addBinaryOp('!=', (a, b) => BoolValue(!_equals(a, b)));
    _addBinaryOp('<', (a, b) => BoolValue(_lessThan(a, b)));
    _addBinaryOp('>', (a, b) => BoolValue(_greaterThan(a, b)));
    _addBinaryOp('<=', (a, b) => BoolValue(_lessThanOrEquals(a, b)));
    _addBinaryOp('>=', (a, b) => BoolValue(_greaterThanOrEquals(a, b)));

    // Logic
    _addBinaryOp('&&', (a, b) => BoolValue(a.isTruthy && b.isTruthy));
    _addBinaryOp('||', (a, b) => BoolValue(a.isTruthy || b.isTruthy));
    _addUnaryOp('!', (a) => BoolValue(!a.isTruthy));

    // Math functions
    _addBinaryOp('MIN', (a, b) => _min(a, b));
    _addBinaryOp('MAX', (a, b) => _max(a, b));
    _addBinaryOp('POW', (a, b) => _pow(a, b));
    _addUnaryOp('FLOOR', (a) => _floor(a));
    _addUnaryOp('CEILING', (a) => _ceiling(a));
    _addUnaryOp('INT', (a) => _int(a));
    _addUnaryOp('FLOAT', (a) => _float(a));

    // List operations
    _addBinaryOp('?', (a, b) => _has(a, b));
    _addBinaryOp('!?', (a, b) => _hasnt(a, b));
    _addBinaryOp('^', (a, b) => _intersect(a, b));
    _addUnaryOp('LIST_MIN', (a) => _listMin(a));
    _addUnaryOp('LIST_MAX', (a) => _listMax(a));
    _addUnaryOp('LIST_ALL', (a) => _listAll(a));
    _addUnaryOp('LIST_COUNT', (a) => _listCount(a));
    _addUnaryOp('LIST_VALUE', (a) => _listValue(a));
    _addUnaryOp('LIST_INVERT', (a) => _listInvert(a));
  }

  static void _addBinaryOp(
    String name,
    AbstractValue Function(AbstractValue, AbstractValue) op,
  ) {
    final func = NativeFunctionCall._prototype(name);
    func._numberOfParameters = 2;
    func._binaryOp = op;
    _nativeFunctions[name] = func;
  }

  static void _addUnaryOp(
    String name,
    AbstractValue Function(AbstractValue) op,
  ) {
    final func = NativeFunctionCall._prototype(name);
    func._numberOfParameters = 1;
    func._unaryOp = op;
    _nativeFunctions[name] = func;
  }

  AbstractValue Function(AbstractValue, AbstractValue)? _binaryOp;
  AbstractValue Function(AbstractValue)? _unaryOp;

  /// Get a native function by name.
  /// Creates a new instance each time to avoid parent conflicts during deserialization.
  static NativeFunctionCall? callWithName(String name) {
    _initialize();
    // Return a NEW instance, not the cached singleton
    // The cached version is only used to check if the function exists
    // and to look up prototype info
    if (_nativeFunctions.containsKey(name)) {
      return NativeFunctionCall(name);
    }
    return null;
  }

  /// Check if a name is a native function.
  static bool isNativeFunction(String name) {
    _initialize();
    return _nativeFunctions.containsKey(name);
  }

  /// Call this function with the given parameters.
  AbstractValue? call(List<InkObject> parameters) {
    // Delegate to prototype if this is a non-prototype instance
    if (_prototype != null) {
      return _prototype!.call(parameters);
    }

    // Coerce values to compatible types for operations
    final coercedParams = _coerceValuesToSingleType(parameters);

    // Direct call on prototype instance
    if (_unaryOp != null && coercedParams.length == 1) {
      final val = coercedParams[0];
      return _unaryOp!(val);
    } else if (_binaryOp != null && coercedParams.length == 2) {
      final a = coercedParams[0];
      final b = coercedParams[1];
      return _binaryOp!(a, b);
    }
    return null;
  }

  /// Coerce values to a single compatible type.
  /// Priority order (by id): Bool(-1) < Int(0) < Float(1) < List(2) < String(3) < DivertTarget(4) < VariablePointer(5)
  static List<AbstractValue> _coerceValuesToSingleType(List<InkObject> parameters) {
    // Find the highest value type (by id, not index)
    ValueType targetType = ValueType.bool_;
    ListValue? specialCaseList;

    for (final obj in parameters) {
      final val = obj as AbstractValue;
      if (val.valueType.id > targetType.id) {
        targetType = val.valueType;
      }
      if (val is ListValue) {
        specialCaseList = val;
      }
    }

    // Coerce all values to the target type
    final result = <AbstractValue>[];
    for (final obj in parameters) {
      final val = obj as AbstractValue;
      result.add(_coerceValue(val, targetType, specialCaseList));
    }
    return result;
  }

  /// Coerce a single value to the target type.
  static AbstractValue _coerceValue(AbstractValue val, ValueType targetType, ListValue? specialCaseList) {
    if (val.valueType == targetType) {
      return val;
    }

    // Bool -> Int coercion
    if (val is BoolValue && targetType == ValueType.int_) {
      return IntValue(val.value! ? 1 : 0);
    }

    // Bool -> Float coercion
    if (val is BoolValue && targetType == ValueType.float_) {
      return FloatValue(val.value! ? 1.0 : 0.0);
    }

    // Int -> Float coercion
    if (val is IntValue && targetType == ValueType.float_) {
      return FloatValue(val.value!.toDouble());
    }

    // Int -> Bool coercion (for logical operations)
    if (val is IntValue && targetType == ValueType.bool_) {
      return BoolValue(val.value != 0);
    }

    // Float -> Bool coercion (for logical operations)
    if (val is FloatValue && targetType == ValueType.bool_) {
      return BoolValue(val.value != 0.0);
    }

    // Any -> String coercion
    if (targetType == ValueType.string) {
      return StringValue(val.valueObject.toString());
    }

    // For list operations with integers, try to create list items from ints
    // This is a simplified implementation - full list coercion would need
    // to look up items in the list's origin definitions
    if (targetType == ValueType.list && val is IntValue && specialCaseList != null) {
      // For now, return original - list operations handle this specially
      return val;
    }

    // If no coercion needed or possible, return original
    return val;
  }

  // Helper to convert bool to int for arithmetic
  static num _toNum(AbstractValue v) {
    if (v is IntValue) return v.value!;
    if (v is FloatValue) return v.value!;
    if (v is BoolValue) return v.value! ? 1 : 0;
    throw BadCastException('Cannot convert ${v.valueType} to number');
  }

  // Arithmetic implementations
  static AbstractValue _add(AbstractValue a, AbstractValue b) {
    if (a is StringValue || b is StringValue) {
      return StringValue('${a.valueObject}${b.valueObject}');
    }
    if (a is ListValue && b is ListValue) {
      return ListValue.fromList(a.value!.union(b.value!));
    }
    // Handle numeric types (including bool -> int coercion)
    if (_isNumericOrBool(a) && _isNumericOrBool(b)) {
      final numA = _toNum(a);
      final numB = _toNum(b);
      // If either is float, result is float
      if (a is FloatValue || b is FloatValue) {
        return FloatValue(numA.toDouble() + numB.toDouble());
      }
      return IntValue((numA + numB).toInt());
    }
    throw BadCastException('Cannot add ${a.valueType} and ${b.valueType}');
  }

  static bool _isNumericOrBool(AbstractValue v) {
    return v is IntValue || v is FloatValue || v is BoolValue;
  }

  static AbstractValue _subtract(AbstractValue a, AbstractValue b) {
    if (a is ListValue && b is ListValue) {
      return ListValue.fromList(a.value!.without(b.value!));
    }
    if (_isNumericOrBool(a) && _isNumericOrBool(b)) {
      final numA = _toNum(a);
      final numB = _toNum(b);
      if (a is FloatValue || b is FloatValue) {
        return FloatValue(numA.toDouble() - numB.toDouble());
      }
      return IntValue((numA - numB).toInt());
    }
    throw BadCastException('Cannot subtract ${a.valueType} and ${b.valueType}');
  }

  static AbstractValue _multiply(AbstractValue a, AbstractValue b) {
    if (_isNumericOrBool(a) && _isNumericOrBool(b)) {
      final numA = _toNum(a);
      final numB = _toNum(b);
      if (a is FloatValue || b is FloatValue) {
        return FloatValue(numA.toDouble() * numB.toDouble());
      }
      return IntValue((numA * numB).toInt());
    }
    throw BadCastException('Cannot multiply ${a.valueType} and ${b.valueType}');
  }

  static AbstractValue _divide(AbstractValue a, AbstractValue b) {
    if (_isNumericOrBool(a) && _isNumericOrBool(b)) {
      final numA = _toNum(a);
      final numB = _toNum(b);
      if (a is FloatValue || b is FloatValue) {
        return FloatValue(numA.toDouble() / numB.toDouble());
      }
      return IntValue(numA.toInt() ~/ numB.toInt());
    }
    throw BadCastException('Cannot divide ${a.valueType} and ${b.valueType}');
  }

  static AbstractValue _mod(AbstractValue a, AbstractValue b) {
    if (_isNumericOrBool(a) && _isNumericOrBool(b)) {
      final numA = _toNum(a);
      final numB = _toNum(b);
      return IntValue(numA.toInt() % numB.toInt());
    }
    throw BadCastException('Cannot mod ${a.valueType} and ${b.valueType}');
  }

  static AbstractValue _negate(AbstractValue a) {
    if (a is FloatValue) {
      return FloatValue(-a.value!);
    }
    if (a is IntValue) {
      return IntValue(-a.value!);
    }
    if (a is BoolValue) {
      return IntValue(a.value! ? -1 : 0);
    }
    throw BadCastException('Cannot negate ${a.valueType}');
  }

  // Comparison implementations - use _toNum for consistent comparison
  static bool _equals(AbstractValue a, AbstractValue b) {
    // For numeric/bool comparisons, compare as numbers
    if (_isNumericOrBool(a) && _isNumericOrBool(b)) {
      return _toNum(a) == _toNum(b);
    }
    return a.valueObject == b.valueObject;
  }

  static bool _lessThan(AbstractValue a, AbstractValue b) {
    if (_isNumericOrBool(a) && _isNumericOrBool(b)) {
      return _toNum(a) < _toNum(b);
    }
    return (a.valueObject as num) < (b.valueObject as num);
  }

  static bool _greaterThan(AbstractValue a, AbstractValue b) {
    if (_isNumericOrBool(a) && _isNumericOrBool(b)) {
      return _toNum(a) > _toNum(b);
    }
    return (a.valueObject as num) > (b.valueObject as num);
  }

  static bool _lessThanOrEquals(AbstractValue a, AbstractValue b) {
    if (_isNumericOrBool(a) && _isNumericOrBool(b)) {
      return _toNum(a) <= _toNum(b);
    }
    return (a.valueObject as num) <= (b.valueObject as num);
  }

  static bool _greaterThanOrEquals(AbstractValue a, AbstractValue b) {
    if (_isNumericOrBool(a) && _isNumericOrBool(b)) {
      return _toNum(a) >= _toNum(b);
    }
    return (a.valueObject as num) >= (b.valueObject as num);
  }

  // Math function implementations
  static AbstractValue _min(AbstractValue a, AbstractValue b) {
    final aNum = _isNumericOrBool(a) ? _toNum(a) : a.valueObject as num;
    final bNum = _isNumericOrBool(b) ? _toNum(b) : b.valueObject as num;
    if (a is FloatValue || b is FloatValue) {
      return FloatValue(aNum < bNum ? aNum.toDouble() : bNum.toDouble());
    }
    return IntValue(aNum < bNum ? aNum.toInt() : bNum.toInt());
  }

  static AbstractValue _max(AbstractValue a, AbstractValue b) {
    final aNum = _isNumericOrBool(a) ? _toNum(a) : a.valueObject as num;
    final bNum = _isNumericOrBool(b) ? _toNum(b) : b.valueObject as num;
    if (a is FloatValue || b is FloatValue) {
      return FloatValue(aNum > bNum ? aNum.toDouble() : bNum.toDouble());
    }
    return IntValue(aNum > bNum ? aNum.toInt() : bNum.toInt());
  }

  static AbstractValue _pow(AbstractValue a, AbstractValue b) {
    final aNum = _isNumericOrBool(a) ? _toNum(a) : a.valueObject as num;
    final bNum = _isNumericOrBool(b) ? _toNum(b) : b.valueObject as num;
    final result = math.pow(aNum.toDouble(), bNum.toDouble());
    // Return int if both inputs are ints and result is whole number
    if (a is IntValue && b is IntValue && result == result.toInt()) {
      return IntValue(result.toInt());
    }
    return FloatValue(result.toDouble());
  }

  static AbstractValue _floor(AbstractValue a) {
    return IntValue((a.valueObject as num).floor());
  }

  static AbstractValue _ceiling(AbstractValue a) {
    return IntValue((a.valueObject as num).ceil());
  }

  static AbstractValue _int(AbstractValue a) {
    return IntValue((a.valueObject as num).toInt());
  }

  static AbstractValue _float(AbstractValue a) {
    return FloatValue((a.valueObject as num).toDouble());
  }

  // List and string operation implementations
  static AbstractValue _has(AbstractValue a, AbstractValue b) {
    // String contains check
    if (a is StringValue && b is StringValue) {
      return BoolValue(a.value!.contains(b.value!));
    }
    // List contains check
    if (a is ListValue && b is ListValue) {
      return BoolValue(a.value!.contains(b.value!));
    }
    return BoolValue(false);
  }

  static AbstractValue _hasnt(AbstractValue a, AbstractValue b) {
    // String does not contain check
    if (a is StringValue && b is StringValue) {
      return BoolValue(!a.value!.contains(b.value!));
    }
    // List does not contain check
    if (a is ListValue && b is ListValue) {
      return BoolValue(!a.value!.contains(b.value!));
    }
    return BoolValue(true);
  }

  static AbstractValue _intersect(AbstractValue a, AbstractValue b) {
    if (a is ListValue && b is ListValue) {
      return ListValue.fromList(a.value!.intersect(b.value!));
    }
    throw BadCastException('Cannot intersect ${a.valueType} and ${b.valueType}');
  }

  static AbstractValue _listMin(AbstractValue a) {
    if (a is ListValue) {
      return ListValue.fromList(a.value!.minAsList());
    }
    throw BadCastException('Cannot get min of ${a.valueType}');
  }

  static AbstractValue _listMax(AbstractValue a) {
    if (a is ListValue) {
      return ListValue.fromList(a.value!.maxAsList());
    }
    throw BadCastException('Cannot get max of ${a.valueType}');
  }

  static AbstractValue _listAll(AbstractValue a) {
    if (a is ListValue) {
      return ListValue.fromList(a.value!.all);
    }
    throw BadCastException('Cannot get all of ${a.valueType}');
  }

  static AbstractValue _listCount(AbstractValue a) {
    if (a is ListValue) {
      return IntValue(a.value!.length);
    }
    throw BadCastException('Cannot count ${a.valueType}');
  }

  static AbstractValue _listValue(AbstractValue a) {
    if (a is ListValue) {
      final max = a.value!.maxItem;
      if (max != null) {
        return IntValue(max.value);
      }
      return IntValue(0);
    }
    throw BadCastException('Cannot get value of ${a.valueType}');
  }

  static AbstractValue _listInvert(AbstractValue a) {
    if (a is ListValue) {
      return ListValue.fromList(a.value!.inverse);
    }
    throw BadCastException('Cannot invert ${a.valueType}');
  }

  @override
  String toString() => 'NativeFunc($name)';
}
