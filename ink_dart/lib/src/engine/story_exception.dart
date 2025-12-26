/// Exception thrown during story execution.
///
/// Used to signal errors that occur during runtime evaluation.
class StoryException implements Exception {
  final String message;
  bool useEndLineNumber = false;

  StoryException(this.message);

  @override
  String toString() => 'StoryException: $message';
}
