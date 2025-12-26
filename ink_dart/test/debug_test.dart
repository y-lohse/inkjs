import 'package:test/test.dart';
import 'test_utils.dart';

void main() {
  test('debug story execution', () {
    final context = fromJsonTestContext('logic_lines_with_newlines', 'logic');
    final story = context.story!;

    print('Initial state:');
    print('  canContinue: ${story.canContinue}');
    print('  hasError: ${story.hasError}');

    // Get the full output
    final output = story.continueMaximally();
    print('');
    print('Full output:');
    print('"$output"');
    print('');
    print('Expected:');
    print('"text1\\ntext 2\\ntext1\\ntext 2\\n"');

    expect(output, equals('text1\ntext 2\ntext1\ntext 2\n'));
  });
}
