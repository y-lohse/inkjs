import 'ink_object.dart';

/// Tag object representing metadata in the story.
///
/// Tags are marked with # in ink source and provide
/// metadata that can be queried during execution.
class Tag extends InkObject {
  final String text;

  Tag(this.text);

  @override
  String toString() => '# $text';

  @override
  InkObject copy() => Tag(text);
}
