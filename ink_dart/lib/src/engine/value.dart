import 'ink_object.dart';
import 'path.dart';
import 'ink_list.dart';

/// Enumeration of all Ink value types.
enum ValueType {
  bool_(-1),
  int_(0),
  float_(1),
  list(2),
  string(3),
  divertTarget(4),
  variablePointer(5);

  final int id;
  const ValueType(this.id);
}

/// Exception thrown when a value cannot be cast to the target type.
class BadCastException implements Exception {
  final String message;
  BadCastException(this.message);

  @override
  String toString() => 'BadCastException: $message';
}

/// Abstract base class for all Ink values.
abstract class AbstractValue extends InkObject {
  /// The type of this value.
  ValueType get valueType;

  /// Whether this value is considered "true" in boolean context.
  bool get isTruthy;

  /// The underlying value as a dynamic object.
  Object? get valueObject;

  /// Cast this value to a different type.
  AbstractValue cast(ValueType newType);

  /// Create a value from a Dart object.
  ///
  /// Automatically determines the appropriate Value subclass.
  static AbstractValue? create(Object? val, [ValueType? preferredNumberType]) {
    // Handle preferred number type for explicit typing
    if (preferredNumberType != null) {
      if (preferredNumberType == ValueType.int_ && val is num) {
        if (val == val.toInt()) {
          return IntValue(val.toInt());
        }
      } else if (preferredNumberType == ValueType.float_ && val is num) {
        return FloatValue(val.toDouble());
      }
    }

    if (val is bool) {
      return BoolValue(val);
    }

    if (val is String) {
      return StringValue(val);
    }

    if (val is int) {
      return IntValue(val);
    }

    if (val is double) {
      return FloatValue(val);
    }

    if (val is Path) {
      return DivertTargetValue(val);
    }

    if (val is InkList) {
      return ListValue.fromList(val);
    }

    return null;
  }

  @override
  InkObject copy() {
    final created = AbstractValue.create(valueObject);
    if (created == null) {
      throw StateError('Could not copy value: $valueObject');
    }
    return created;
  }

  /// Create a BadCastException for invalid casts.
  BadCastException badCastException(ValueType targetType) {
    return BadCastException(
      "Can't cast $valueObject from $valueType to $targetType",
    );
  }
}

/// Generic base class for typed values.
abstract class Value<T> extends AbstractValue {
  T? value;

  Value(this.value);

  @override
  Object? get valueObject => value;

  @override
  String toString() {
    if (value == null) {
      throw StateError('Value is null');
    }
    return value.toString();
  }
}

/// Boolean value.
class BoolValue extends Value<bool> {
  BoolValue(bool val) : super(val);

  @override
  bool get isTruthy => value ?? false;

  @override
  ValueType get valueType => ValueType.bool_;

  @override
  AbstractValue cast(ValueType newType) {
    if (value == null) throw StateError('Value is null');

    if (newType == valueType) return this;

    switch (newType) {
      case ValueType.int_:
        return IntValue(value! ? 1 : 0);
      case ValueType.float_:
        return FloatValue(value! ? 1.0 : 0.0);
      case ValueType.string:
        return StringValue(value! ? 'true' : 'false');
      default:
        throw badCastException(newType);
    }
  }

  @override
  String toString() => value == true ? 'true' : 'false';
}

/// Integer value.
class IntValue extends Value<int> {
  IntValue(int val) : super(val);

  @override
  bool get isTruthy => (value ?? 0) != 0;

  @override
  ValueType get valueType => ValueType.int_;

  @override
  AbstractValue cast(ValueType newType) {
    if (value == null) throw StateError('Value is null');

    if (newType == valueType) return this;

    switch (newType) {
      case ValueType.bool_:
        return BoolValue(value != 0);
      case ValueType.float_:
        return FloatValue(value!.toDouble());
      case ValueType.string:
        return StringValue(value.toString());
      default:
        throw badCastException(newType);
    }
  }
}

/// Floating-point value.
class FloatValue extends Value<double> {
  FloatValue(double val) : super(val);

  @override
  bool get isTruthy => (value ?? 0.0) != 0.0;

  @override
  ValueType get valueType => ValueType.float_;

  @override
  AbstractValue cast(ValueType newType) {
    if (value == null) throw StateError('Value is null');

    if (newType == valueType) return this;

    switch (newType) {
      case ValueType.bool_:
        return BoolValue(value != 0.0);
      case ValueType.int_:
        return IntValue(value!.toInt());
      case ValueType.string:
        return StringValue(value.toString());
      default:
        throw badCastException(newType);
    }
  }
}

/// String value.
class StringValue extends Value<String> {
  late final bool _isNewline;
  late final bool _isInlineWhitespace;

  StringValue(String val) : super(val) {
    _isNewline = value == '\n';
    _isInlineWhitespace = _computeIsInlineWhitespace();
  }

  bool _computeIsInlineWhitespace() {
    if (value == null || value!.isEmpty) {
      return true;
    }
    for (final c in value!.split('')) {
      if (c != ' ' && c != '\t') {
        return false;
      }
    }
    return true;
  }

  @override
  ValueType get valueType => ValueType.string;

  @override
  bool get isTruthy => (value?.isNotEmpty ?? false);

  /// Whether this string is just a newline.
  bool get isNewline => _isNewline;

  /// Whether this string is only spaces and tabs.
  bool get isInlineWhitespace => _isInlineWhitespace;

  /// Whether this string has non-whitespace content.
  bool get isNonWhitespace => !isNewline && !isInlineWhitespace;

  @override
  AbstractValue cast(ValueType newType) {
    if (newType == valueType) return this;

    if (newType == ValueType.int_) {
      final parsed = int.tryParse(value ?? '');
      if (parsed != null) {
        return IntValue(parsed);
      }
      throw badCastException(newType);
    }

    if (newType == ValueType.float_) {
      final parsed = double.tryParse(value ?? '');
      if (parsed != null) {
        return FloatValue(parsed);
      }
      throw badCastException(newType);
    }

    throw badCastException(newType);
  }
}

/// Divert target value - a path to a location in the story.
class DivertTargetValue extends Value<Path> {
  DivertTargetValue([Path? targetPath]) : super(targetPath);

  @override
  ValueType get valueType => ValueType.divertTarget;

  /// The target path.
  Path get targetPath {
    if (value == null) throw StateError('Value is null');
    return value!;
  }

  set targetPath(Path path) {
    value = path;
  }

  @override
  bool get isTruthy {
    throw StateError("Shouldn't be checking the truthiness of a divert target");
  }

  @override
  AbstractValue cast(ValueType newType) {
    if (newType == valueType) return this;
    throw badCastException(newType);
  }

  @override
  String toString() => 'DivertTargetValue($targetPath)';
}

/// Variable pointer value - a reference to a variable.
class VariablePointerValue extends Value<String> {
  int _contextIndex;

  VariablePointerValue(String variableName, [int contextIndex = -1])
      : _contextIndex = contextIndex,
        super(variableName);

  @override
  ValueType get valueType => ValueType.variablePointer;

  /// The context index for variable lookup.
  int get contextIndex => _contextIndex;
  set contextIndex(int value) => _contextIndex = value;

  /// The variable name.
  String get variableName {
    if (value == null) throw StateError('Value is null');
    return value!;
  }

  set variableName(String name) {
    value = name;
  }

  @override
  bool get isTruthy {
    throw StateError("Shouldn't be checking the truthiness of a variable pointer");
  }

  @override
  AbstractValue cast(ValueType newType) {
    if (newType == valueType) return this;
    throw badCastException(newType);
  }

  @override
  String toString() => 'VariablePointerValue($variableName)';

  @override
  InkObject copy() => VariablePointerValue(variableName, contextIndex);
}

/// List value - a set of named items from list definitions.
class ListValue extends Value<InkList> {
  ListValue() : super(InkList());

  ListValue.fromList(InkList list) : super(InkList.from(list));

  ListValue.fromItem(InkListItem item, int itemValue)
      : super(InkList.fromItem(item, itemValue));

  @override
  bool get isTruthy {
    if (value == null) throw StateError('Value is null');
    return value!.isNotEmpty;
  }

  @override
  ValueType get valueType => ValueType.list;

  @override
  AbstractValue cast(ValueType newType) {
    if (value == null) throw StateError('Value is null');

    if (newType == ValueType.int_) {
      final max = value!.maxItem;
      if (max == null || max.key.isNull) return IntValue(0);
      return IntValue(max.value);
    }

    if (newType == ValueType.float_) {
      final max = value!.maxItem;
      if (max == null || max.key.isNull) return FloatValue(0.0);
      return FloatValue(max.value.toDouble());
    }

    if (newType == ValueType.string) {
      final max = value!.maxItem;
      if (max == null || max.key.isNull) return StringValue('');
      return StringValue(max.key.toString());
    }

    if (newType == valueType) return this;

    throw badCastException(newType);
  }

  /// Retain origin names when assigning empty list.
  static void retainListOriginsForAssignment(
    InkObject? oldValue,
    InkObject newValue,
  ) {
    if (oldValue is! ListValue || newValue is! ListValue) return;

    final oldList = oldValue.value;
    final newList = newValue.value;

    if (oldList == null || newList == null) return;

    // When assigning the empty list, try to retain any initial origin names
    if (newList.isEmpty) {
      newList.setInitialOriginNames(oldList.originNames);
    }
  }
}

