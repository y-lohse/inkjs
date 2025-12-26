/// Simple JSON serialization utilities for Ink runtime.
///
/// Provides a Writer class for building JSON output and
/// utilities for parsing JSON input.
class SimpleJson {
  /// Parse JSON text to a dictionary.
  static Map<String, dynamic> textToDictionary(String json) {
    // In Dart, we use the built-in JSON decoder
    // This is a thin wrapper for compatibility
    return Map<String, dynamic>.from(
      // ignore: avoid_dynamic_calls
      _parseJson(json) as Map,
    );
  }

  static dynamic _parseJson(String json) {
    // Use Dart's built-in JSON parsing
    return _JsonParser(json).parse();
  }
}

/// JSON Writer for building serialized output.
class SimpleJsonWriter {
  final StringBuffer _buffer = StringBuffer();
  final List<_StateType> _stateStack = [];
  bool _needsComma = false;

  SimpleJsonWriter();

  void writeObjectStart() {
    _writeCommaIfNeeded();
    _buffer.write('{');
    _stateStack.add(_StateType.object);
    _needsComma = false;
  }

  void writeObjectEnd() {
    _buffer.write('}');
    _stateStack.removeLast();
    _needsComma = true;
  }

  void writeArrayStart() {
    _writeCommaIfNeeded();
    _buffer.write('[');
    _stateStack.add(_StateType.array);
    _needsComma = false;
  }

  void writeArrayEnd() {
    _buffer.write(']');
    _stateStack.removeLast();
    _needsComma = true;
  }

  void writePropertyStart(String name) {
    _writeCommaIfNeeded();
    _writeEscapedString(name);
    _buffer.write(':');
    _needsComma = false;
  }

  void writePropertyEnd() {
    _needsComma = true;
  }

  void writeProperty(String name, dynamic value) {
    writePropertyStart(name);
    _writeValue(value);
    writePropertyEnd();
  }

  void writeIntProperty(String name, int value) {
    writePropertyStart(name);
    _buffer.write(value);
    writePropertyEnd();
  }

  void write(dynamic value, [bool escape = true]) {
    _writeCommaIfNeeded();
    _writeValue(value);
    _needsComma = true;
  }

  void writeNull() {
    _writeCommaIfNeeded();
    _buffer.write('null');
    _needsComma = true;
  }

  void writeInt(int? value) {
    _writeCommaIfNeeded();
    _buffer.write(value ?? 0);
    _needsComma = true;
  }

  void writeFloat(double? value) {
    _writeCommaIfNeeded();
    _buffer.write(value ?? 0.0);
    _needsComma = true;
  }

  void writeBool(bool? value) {
    _writeCommaIfNeeded();
    _buffer.write(value == true ? 'true' : 'false');
    _needsComma = true;
  }

  void writeStringStart() {
    _writeCommaIfNeeded();
    _buffer.write('"');
  }

  void writeStringInner(String? value) {
    if (value != null) {
      _buffer.write(_escape(value));
    }
  }

  void writeStringEnd() {
    _buffer.write('"');
    _needsComma = true;
  }

  void writePropertyNameStart() {
    _writeCommaIfNeeded();
    _buffer.write('"');
  }

  void writePropertyNameInner(String value) {
    _buffer.write(_escape(value));
  }

  void writePropertyNameEnd() {
    _buffer.write('":');
    _needsComma = false;
  }

  void _writeCommaIfNeeded() {
    if (_needsComma && _stateStack.isNotEmpty) {
      _buffer.write(',');
    }
  }

  void _writeValue(dynamic value) {
    if (value == null) {
      _buffer.write('null');
    } else if (value is bool) {
      _buffer.write(value ? 'true' : 'false');
    } else if (value is int) {
      _buffer.write(value);
    } else if (value is double) {
      _buffer.write(value);
    } else if (value is String) {
      _writeEscapedString(value);
    } else {
      _writeEscapedString(value.toString());
    }
  }

  void _writeEscapedString(String value) {
    _buffer.write('"');
    _buffer.write(_escape(value));
    _buffer.write('"');
  }

  String _escape(String value) {
    return value
        .replaceAll('\\', '\\\\')
        .replaceAll('"', '\\"')
        .replaceAll('\n', '\\n')
        .replaceAll('\r', '\\r')
        .replaceAll('\t', '\\t');
  }

  @override
  String toString() => _buffer.toString();
}

enum _StateType {
  object,
  array,
}

/// Simple JSON parser.
class _JsonParser {
  final String _input;
  int _pos = 0;

  _JsonParser(this._input);

  dynamic parse() {
    _skipWhitespace();
    return _parseValue();
  }

  dynamic _parseValue() {
    _skipWhitespace();
    if (_pos >= _input.length) return null;

    final char = _input[_pos];
    if (char == '{') return _parseObject();
    if (char == '[') return _parseArray();
    if (char == '"') return _parseString();
    if (char == 't' || char == 'f') return _parseBool();
    if (char == 'n') return _parseNull();
    if (char == '-' || _isDigit(char)) return _parseNumber();

    throw FormatException('Unexpected character: $char at $_pos');
  }

  Map<String, dynamic> _parseObject() {
    _expect('{');
    _skipWhitespace();

    final result = <String, dynamic>{};

    if (_input[_pos] == '}') {
      _pos++;
      return result;
    }

    while (true) {
      _skipWhitespace();
      final key = _parseString();
      _skipWhitespace();
      _expect(':');
      _skipWhitespace();
      final value = _parseValue();
      result[key] = value;
      _skipWhitespace();

      if (_input[_pos] == '}') {
        _pos++;
        break;
      }
      _expect(',');
    }

    return result;
  }

  List<dynamic> _parseArray() {
    _expect('[');
    _skipWhitespace();

    final result = <dynamic>[];

    if (_input[_pos] == ']') {
      _pos++;
      return result;
    }

    while (true) {
      _skipWhitespace();
      result.add(_parseValue());
      _skipWhitespace();

      if (_input[_pos] == ']') {
        _pos++;
        break;
      }
      _expect(',');
    }

    return result;
  }

  String _parseString() {
    _expect('"');
    final buffer = StringBuffer();

    while (_pos < _input.length && _input[_pos] != '"') {
      if (_input[_pos] == '\\') {
        _pos++;
        if (_pos >= _input.length) break;
        switch (_input[_pos]) {
          case 'n':
            buffer.write('\n');
            break;
          case 'r':
            buffer.write('\r');
            break;
          case 't':
            buffer.write('\t');
            break;
          case '"':
            buffer.write('"');
            break;
          case '\\':
            buffer.write('\\');
            break;
          default:
            buffer.write(_input[_pos]);
        }
      } else {
        buffer.write(_input[_pos]);
      }
      _pos++;
    }

    _expect('"');
    return buffer.toString();
  }

  num _parseNumber() {
    final start = _pos;
    if (_input[_pos] == '-') _pos++;

    while (_pos < _input.length && _isDigit(_input[_pos])) {
      _pos++;
    }

    bool isFloat = false;
    if (_pos < _input.length && _input[_pos] == '.') {
      isFloat = true;
      _pos++;
      while (_pos < _input.length && _isDigit(_input[_pos])) {
        _pos++;
      }
    }

    if (_pos < _input.length && (_input[_pos] == 'e' || _input[_pos] == 'E')) {
      isFloat = true;
      _pos++;
      if (_pos < _input.length && (_input[_pos] == '+' || _input[_pos] == '-')) {
        _pos++;
      }
      while (_pos < _input.length && _isDigit(_input[_pos])) {
        _pos++;
      }
    }

    final str = _input.substring(start, _pos);
    return isFloat ? double.parse(str) : int.parse(str);
  }

  bool _parseBool() {
    if (_input.substring(_pos).startsWith('true')) {
      _pos += 4;
      return true;
    }
    if (_input.substring(_pos).startsWith('false')) {
      _pos += 5;
      return false;
    }
    throw FormatException('Expected boolean at $_pos');
  }

  dynamic _parseNull() {
    if (_input.substring(_pos).startsWith('null')) {
      _pos += 4;
      return null;
    }
    throw FormatException('Expected null at $_pos');
  }

  void _skipWhitespace() {
    while (_pos < _input.length) {
      final char = _input[_pos];
      if (char == ' ' || char == '\t' || char == '\n' || char == '\r') {
        _pos++;
      } else {
        break;
      }
    }
  }

  void _expect(String char) {
    if (_pos >= _input.length || _input[_pos] != char) {
      throw FormatException('Expected "$char" at $_pos');
    }
    _pos++;
  }

  bool _isDigit(String char) {
    return char.codeUnitAt(0) >= 48 && char.codeUnitAt(0) <= 57;
  }
}
