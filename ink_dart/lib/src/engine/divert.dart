import 'ink_object.dart';
import 'container.dart';
import 'path.dart';
import 'pointer.dart';

/// The type of push/pop operation for diverts.
enum PushPopType {
  function,
  tunnel,
  functionEvaluationFromGame,
}

/// A divert represents a jump to another location in the story.
///
/// Diverts can be:
/// - Simple jumps (->)
/// - Tunnels (->->)
/// - Function calls
/// - Conditional diverts
/// - Variable target diverts
class Divert extends InkObject {
  Path? _targetPath;
  Pointer? _targetPointer;

  /// The name of the variable containing the target (for variable diverts).
  String? variableDivertName;

  /// Whether this divert targets a variable.
  bool get hasVariableTarget => variableDivertName != null;

  /// Whether this divert pushes to the call stack.
  bool pushesToStack = false;

  /// The type of stack push (function or tunnel).
  PushPopType? stackPushType;

  /// Whether this is an external function call.
  bool isExternal = false;

  /// Number of arguments for external function calls.
  int externalArgs = 0;

  /// Whether this is a conditional divert.
  bool isConditional = false;

  /// The target path.
  Path? get targetPath {
    if (_targetPath != null && _targetPath!.isRelative) {
      final targetObj = targetPointer.element;
      if (targetObj != null) {
        _targetPath = targetObj.path;
      }
    }
    return _targetPath;
  }

  set targetPath(Path? value) {
    _targetPath = value;
    _targetPointer = null;
  }

  /// The target pointer (resolved from path).
  Pointer get targetPointer {
    if (_targetPointer == null) {
      final targetObj = resolvePath(_targetPath!).obj;
      if (targetObj == null) {
        _targetPointer = Pointer.null_();
      } else if (targetObj is Container) {
        _targetPointer = Pointer.startOf(targetObj);
      } else {
        final parentContainer = targetObj.parent as Container?;
        if (parentContainer != null) {
          _targetPointer = Pointer(
            parentContainer,
            parentContainer.content.indexOf(targetObj),
          );
        } else {
          _targetPointer = Pointer.null_();
        }
      }
    }
    return _targetPointer!;
  }

  /// The target path as a string.
  String? get targetPathString {
    if (targetPath == null) return null;
    return compactPathString(targetPath!);
  }

  set targetPathString(String? value) {
    if (value == null) {
      targetPath = null;
    } else {
      targetPath = Path.fromString(value);
    }
  }

  /// The target content object.
  InkObject? get targetContent {
    if (targetPath == null) return null;
    return resolvePath(targetPath!).obj;
  }

  @override
  String toString() {
    if (hasVariableTarget) {
      return 'Divert(variable: $variableDivertName)';
    } else if (targetPath != null) {
      final target = targetPathString ?? targetPath.toString();
      if (isConditional) {
        return 'Divert($target, conditional)';
      }
      if (pushesToStack) {
        return 'Divert($target, ${stackPushType?.name})';
      }
      return 'Divert($target)';
    }
    return 'Divert(?)';
  }

  @override
  bool operator ==(Object other) {
    if (other is Divert) {
      if (hasVariableTarget != other.hasVariableTarget) return false;
      if (hasVariableTarget) {
        return variableDivertName == other.variableDivertName;
      }
      return targetPath == other.targetPath;
    }
    return false;
  }

  @override
  int get hashCode => hasVariableTarget
      ? variableDivertName.hashCode
      : (targetPath?.hashCode ?? 0);
}
