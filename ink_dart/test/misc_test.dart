import 'package:test/test.dart';
import 'test_utils.dart';

void main() {
  group('Misc', () {
    // TestHelloWorld
    test('tests hello world', () {
      final context = fromJsonTestContext('hello_world', 'misc');
      expect(context.story!.continueStory(), equals('Hello world\n'));
    });

    // TestEnd
    test('tests end', () {
      final context = fromJsonTestContext('end', 'misc');
      expect(context.story!.continueMaximally(), equals("hello\n"));
    });

    // TestEnd2
    test('tests end2', () {
      final context = fromJsonTestContext('end2', 'misc');
      expect(context.story!.continueMaximally(), equals("hello\n"));
    });

    // TestEscapeCharacter
    test('tests escape character', () {
      final context = fromJsonTestContext('escape_character', 'misc');
      expect(context.story!.continueMaximally(), equals("this is a '|' character\n"));
    });

    // TestIdentifiersCanStartWithNumbers
    test('tests identifiers can start with numbers', () {
      final context = fromJsonTestContext('identifiers_can_start_with_number', 'misc');
      expect(
        context.story!.continueMaximally(),
        equals("512x2 = 1024\n512x2p2 = 1026\n"),
      );
    });
  });

  group('Strings', () {
    // TestStringsInChoices
    test('tests strings in choices', () {
      final context = fromJsonTestContext('strings_in_choices', 'strings');
      context.story!.continueMaximally();
      expect(context.story!.currentChoices.length, equals(1));
      expect(context.story!.currentChoices[0].text, equals('test1 "test2 test3"'));
      context.story!.chooseChoiceIndex(0);
      expect(context.story!.continueStory(), equals('test1 test4\n'));
    });

    // TestStringConstants
    test('tests string constants', () {
      final context = fromJsonTestContext('string_constants', 'strings');
      expect(context.story!.continueStory(), equals("hi\n"));
    });

    // TestStringContains
    test('tests string contains', () {
      final context = fromJsonTestContext('string_contains', 'strings');
      expect(context.story!.continueMaximally(), equals("true\nfalse\ntrue\ntrue\n"));
    });
  });

  group('Newlines', () {
    // TestNewlineAtStartOfMultilineConditional
    test('tests newline at start of multiline conditional', () {
      final context = fromJsonTestContext('newline_at_start_of_multiline_conditional', 'newlines');
      expect(context.story!.continueMaximally(), equals("X\nx\n"));
    });

    // TestNewlineConsistency1
    test('tests newline consistency 1', () {
      final context = fromJsonTestContext('newline_consistency_1', 'newlines');
      expect(context.story!.continueMaximally(), equals("hello world\n"));
    });

    // TestNewlineConsistency2
    test('tests newline consistency 2', () {
      final context = fromJsonTestContext('newline_consistency_2', 'newlines');
      context.story!.continueStory();
      context.story!.chooseChoiceIndex(0);
      expect(context.story!.continueMaximally(), equals("hello world\n"));
    });

    // TestNewlineConsistency3
    test('tests newline consistency 3', () {
      final context = fromJsonTestContext('newline_consistency_3', 'newlines');
      context.story!.continueStory();
      context.story!.chooseChoiceIndex(0);
      expect(context.story!.continueMaximally(), equals("hello\nworld\n"));
    });
  });

  group('Variables', () {
    // TestVariableDeclarationInConditional
    test('tests variable declaration in conditional', () {
      final context = fromJsonTestContext('variable_declaration_in_conditional', 'variables');
      expect(context.story!.continueMaximally(), equals("5\n"));
    });

    // TestVariableTunnel
    test('tests variable tunnel', () {
      final context = fromJsonTestContext('variable_tunnel', 'variables');
      expect(context.story!.continueMaximally(), equals("STUFF\n"));
    });

    // TestTempGlobalConflict
    test('tests temp global conflict', () {
      final context = fromJsonTestContext('temp_global_conflict', 'variables');
      // inkjs uses Continue() not ContinueMaximally()
      expect(context.story!.continueStory(), equals("0\n"));
    });

    // TestTempNotFound - inkjs expects this to throw
    test('tests temp not found', () {
      final context = fromJsonTestContext('temp_not_found', 'variables');
      // This test expects an exception due to variable not found warning
      expect(
        () => context.story!.continueMaximally(),
        throwsA(isA<Exception>()),
      );
    });

    // TestConst
    test('tests const', () {
      final context = fromJsonTestContext('const', 'variables');
      expect(context.story!.continueMaximally(), equals("5\n"));
    });
  });

  group('Conditions', () {
    // TestElseBranches
    test('tests else branches', () {
      final context = fromJsonTestContext('else_branches', 'conditions');
      expect(context.story!.continueMaximally(), equals("other\nother\nother\nother\n"));
    });

    // TestEmptyMultilineConditionalBranch
    test('tests empty multiline conditional branch', () {
      final context = fromJsonTestContext('empty_multiline_conditional_branch', 'conditions');
      expect(context.story!.continueStory(), equals(""));
    });

    // TestConditionals
    test('tests conditionals', () {
      final context = fromJsonTestContext('conditionals', 'conditions');
      expect(context.story!.continueMaximally(), equals("true\ntrue\ntrue\ntrue\ntrue\ngreat\nright?\n"));
    });

    // TestTrivialCondition
    test('tests trivial condition', () {
      final context = fromJsonTestContext('trivial_condition', 'conditions');
      expect(context.story!.continueMaximally(), equals(""));
    });
  });

  group('Booleans', () {
    // TestTrue
    test('tests true', () {
      final context = fromJsonTestContext('true', 'booleans');
      expect(context.story!.continueMaximally(), equals("true\n"));
    });

    // TestNotTrue
    test('tests not true', () {
      final context = fromJsonTestContext('not_true', 'booleans');
      expect(context.story!.continueMaximally(), equals("false\n"));
    });

    // TestNotOne - not 1 = false (0)
    test('tests not one', () {
      final context = fromJsonTestContext('not_one', 'booleans');
      expect(context.story!.continueMaximally(), equals("false\n"));
    });

    // TestFalsePlusFalse - false + false = 0
    test('tests false plus false', () {
      final context = fromJsonTestContext('false_plus_false', 'booleans');
      expect(context.story!.continueMaximally(), equals("0\n"));
    });

    // TestTruePlusTrue - true + true = 2
    test('tests true plus true', () {
      final context = fromJsonTestContext('true_plus_true', 'booleans');
      expect(context.story!.continueMaximally(), equals("2\n"));
    });

    // TestTruePlusOne - true + 1 = 2
    test('tests true plus one', () {
      final context = fromJsonTestContext('true_plus_one', 'booleans');
      expect(context.story!.continueMaximally(), equals("2\n"));
    });

    // TestThreeGreaterThanOne - 3 > 1 = true
    test('tests three greater than one', () {
      final context = fromJsonTestContext('three_greater_than_one', 'booleans');
      expect(context.story!.continueMaximally(), equals("true\n"));
    });

    // TestTrueEqualsOne - true == 1 = true
    test('tests true equals one', () {
      final context = fromJsonTestContext('true_equals_one', 'booleans');
      expect(context.story!.continueMaximally(), equals("true\n"));
    });
  });

  group('Evaluation', () {
    // TestArithmetic
    test('tests arithmetic', () {
      final context = fromJsonTestContext('arithmetic', 'evaluation');
      final output = context.story!.continueMaximally();
      // Check each line separately, with flexible float matching
      final lines = output.split('\n');
      expect(lines[0], equals('36'));
      expect(lines[1], equals('2'));
      expect(lines[2], equals('3'));
      expect(lines[3], equals('2'));
      expect(double.parse(lines[4]), closeTo(2.333333, 0.001));
      expect(lines[5], equals('8'));
      expect(lines[6], equals('8'));
    });

    // TestIncrement
    test('tests increment', () {
      final context = fromJsonTestContext('increment', 'evaluation');
      expect(context.story!.continueMaximally(), equals("6\n5\n"));
    });

    // TestLiteralUnary
    test('tests literal unary', () {
      final context = fromJsonTestContext('literal_unary', 'evaluation');
      expect(context.story!.continueMaximally(), equals("-1\nfalse\ntrue\n"));
    });

    // TestBasicStringLiterals
    test('tests basic string literals', () {
      final context = fromJsonTestContext('basic_string_literals', 'evaluation');
      expect(context.story!.continueMaximally(), equals("Hello world 1\nHello world 2.\n"));
    });
  });
}
