import 'ink_object.dart';

/// Glue object that controls whitespace joining between content.
///
/// When glue appears in the output stream, it causes adjacent
/// content to be joined without whitespace.
class Glue extends InkObject {
  @override
  String toString() => 'Glue';

  @override
  InkObject copy() => Glue();
}
