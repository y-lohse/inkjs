import 'dart:io';
import 'dart:convert';
import 'package:ink_dart/ink_dart.dart';

/// Base path to compiled ink files
String get compiledPath => 'test/inkfiles/compiled';

/// Load a compiled .ink.json file
String loadJsonFile(String filename, String category) {
  final filePath = '$compiledPath/$category/$filename.ink.json';
  final file = File(filePath);
  if (!file.existsSync()) {
    throw FileSystemException('File not found: $filePath');
  }
  var content = file.readAsStringSync();
  // Strip BOM if present
  if (content.startsWith('\uFEFF')) {
    content = content.substring(1);
  }
  return content;
}

/// Test context for holding story state and error tracking
class TestContext {
  Story? story;
  String? bytecode;

  bool testingErrors;

  List<String> errorMessages = [];
  List<String> warningMessages = [];
  List<String> authorMessages = [];

  TestContext({this.testingErrors = false});

  void onError(String message, ErrorType type) {
    if (testingErrors) {
      switch (type) {
        case ErrorType.error:
          errorMessages.add(message);
          break;
        case ErrorType.warning:
          warningMessages.add(message);
          break;
      }
    }
  }
}

/// Create a test context from a pre-compiled JSON file
TestContext fromJsonTestContext(
  String name,
  String category, {
  bool testingErrors = false,
}) {
  final context = TestContext(testingErrors: testingErrors);
  final jsonContent = loadJsonFile(name, category);
  context.story = Story(jsonContent);
  context.bytecode = context.story!.toJson();
  return context;
}

/// Helper to load and create a story directly
Story loadStory(String name, String category) {
  final jsonContent = loadJsonFile(name, category);
  return Story(jsonContent);
}

/// Helper to check if a list of strings contains a substring
bool containsStringContaining(List<String> list, String substring) {
  return list.any((s) => s.contains(substring));
}
