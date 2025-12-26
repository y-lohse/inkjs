/// Debug metadata for tracking source file locations.
///
/// Used for error reporting and debugging to map runtime content
/// back to original .ink source files.
class DebugMetadata {
  int startLineNumber = 0;
  int endLineNumber = 0;
  int startCharacterNumber = 0;
  int endCharacterNumber = 0;
  String? fileName;
  String? sourceName;

  DebugMetadata();

  /// Merge two metadata ranges into one that covers both.
  DebugMetadata merge(DebugMetadata other) {
    final newMetadata = DebugMetadata();

    // Use the earlier start
    if (startLineNumber < other.startLineNumber) {
      newMetadata.startLineNumber = startLineNumber;
      newMetadata.startCharacterNumber = startCharacterNumber;
    } else if (startLineNumber > other.startLineNumber) {
      newMetadata.startLineNumber = other.startLineNumber;
      newMetadata.startCharacterNumber = other.startCharacterNumber;
    } else {
      newMetadata.startLineNumber = startLineNumber;
      newMetadata.startCharacterNumber = startCharacterNumber < other.startCharacterNumber
          ? startCharacterNumber
          : other.startCharacterNumber;
    }

    // Use the later end
    if (endLineNumber > other.endLineNumber) {
      newMetadata.endLineNumber = endLineNumber;
      newMetadata.endCharacterNumber = endCharacterNumber;
    } else if (endLineNumber < other.endLineNumber) {
      newMetadata.endLineNumber = other.endLineNumber;
      newMetadata.endCharacterNumber = other.endCharacterNumber;
    } else {
      newMetadata.endLineNumber = endLineNumber;
      newMetadata.endCharacterNumber = endCharacterNumber > other.endCharacterNumber
          ? endCharacterNumber
          : other.endCharacterNumber;
    }

    newMetadata.fileName = fileName ?? other.fileName;
    newMetadata.sourceName = sourceName ?? other.sourceName;

    return newMetadata;
  }

  @override
  String toString() {
    if (fileName != null) {
      return 'line $startLineNumber of $fileName';
    }
    return 'line $startLineNumber';
  }
}
