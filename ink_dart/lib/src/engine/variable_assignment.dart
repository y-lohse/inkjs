import 'ink_object.dart';

/// An assignment to a variable in the story.
///
/// Handles both global and temporary variable assignments.
class VariableAssignment extends InkObject {
  /// The name of the variable being assigned.
  String? variableName;

  /// Whether this is a new declaration (vs re-assignment).
  bool isNewDeclaration;

  /// Whether this is a global variable.
  bool isGlobal = false;

  VariableAssignment([this.variableName, this.isNewDeclaration = false]);

  @override
  String toString() {
    final prefix = isGlobal ? 'global ' : (isNewDeclaration ? 'temp ' : '');
    return 'VarAssign(${prefix}$variableName)';
  }
}
