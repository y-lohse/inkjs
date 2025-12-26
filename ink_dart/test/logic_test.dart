import 'package:test/test.dart';
import 'test_utils.dart';

void main() {
  group('Logic', () {
    // TestLogicLinesWithNewlines
    test('tests logic lines with newlines', () {
      final context = fromJsonTestContext('logic_lines_with_newlines', 'logic');
      expect(
        context.story!.continueMaximally(),
        equals('text1\ntext 2\ntext1\ntext 2\n'),
      );
    });

    // TestMultilineLogicWithGlue
    test('tests multiline logic with glue', () {
      final context = fromJsonTestContext('multiline_logic_with_glue', 'logic');
      expect(context.story!.continueMaximally(), equals('a b\na b\n'));
    });

    // TestNestedPassByReference
    test('tests nested pass by reference', () {
      final context = fromJsonTestContext('nested_pass_by_reference', 'logic');
      expect(context.story!.continueMaximally(), equals('5\n625\n'));
    });

    // TestPrintNum
    test('tests print num', () {
      final context = fromJsonTestContext('print_num', 'logic');
      expect(
        context.story!.continueMaximally(),
        equals(
          '. four .\n. fifteen .\n. thirty-seven .\n. one hundred and one .\n. two hundred and twenty-two .\n. one thousand two hundred and thirty-four .\n',
        ),
      );
    });
  });
}
