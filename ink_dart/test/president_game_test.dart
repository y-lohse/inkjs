import 'package:test/test.dart';
import 'test_utils.dart';

void main() {
  group('President Game', () {
    test('starts with correct initial values', () {
      final context = fromJsonTestContext('president_game', 'game');
      final story = context.story!;

      // Check initial variable values
      expect(story.variablesState!['public_approval'], equals(50));
      expect(story.variablesState!['international_rep'], equals(50));
      expect(story.variablesState!['economic_stability'], equals(50));
      expect(story.variablesState!['budget'], equals(100));
      expect(story.variablesState!['legacy_points'], equals(0));
      expect(story.variablesState!['day'], equals(1));
      expect(story.variablesState!['intelligence'], equals(70));
      expect(story.variablesState!['charisma'], equals(50));
    });

    test('morning briefing presents choices', () {
      final context = fromJsonTestContext('president_game', 'game');
      final story = context.story!;

      // Continue to get opening text
      final openingText = story.continueMaximally();
      expect(openingText, contains('President Fictious'));
      expect(openingText, contains('Situation Room'));

      // Should have choices
      expect(story.currentChoices.length, greaterThanOrEqualTo(2));

      // Check choice texts
      final choiceTexts = story.currentChoices.map((c) => c.text).toList();
      expect(choiceTexts, contains(contains('cyber threat')));
      expect(choiceTexts, contains(contains('UFO sighting')));
    });

    test('choosing cyber threat affects variables correctly', () {
      final context = fromJsonTestContext('president_game', 'game');
      final story = context.story!;

      story.continueMaximally();

      // Find and choose cyber threat option
      final cyberChoiceIndex = story.currentChoices
          .indexWhere((c) => c.text!.contains('cyber threat'));
      expect(cyberChoiceIndex, greaterThanOrEqualTo(0));

      story.chooseChoiceIndex(cyberChoiceIndex);
      story.continueMaximally();

      // Check variable changes
      expect(story.variablesState!['intelligence'], equals(80)); // +10
      expect(story.variablesState!['cyber_threat_active'], equals(true));
      expect(story.variablesState!['public_approval'], equals(45)); // -5
      expect(story.variablesState!['deep_state_influence'], equals(60)); // +10
    });

    test('choosing UFO investigation affects variables correctly', () {
      final context = fromJsonTestContext('president_game', 'game');
      final story = context.story!;

      story.continueMaximally();

      // Find and choose UFO option
      final ufoChoiceIndex = story.currentChoices
          .indexWhere((c) => c.text!.contains('UFO'));
      expect(ufoChoiceIndex, greaterThanOrEqualTo(0));

      story.chooseChoiceIndex(ufoChoiceIndex);
      story.continueMaximally();

      // Check variable changes
      expect(story.variablesState!['ufo_secrecy'], equals(65)); // -15
      expect(story.variablesState!['public_approval'], equals(60)); // +10
      expect(story.variablesState!['moral_integrity'], equals(45)); // -5
    });

    test('policy meeting shows budget in text', () {
      final context = fromJsonTestContext('president_game', 'game');
      final story = context.story!;

      // Get past morning briefing
      story.continueMaximally();
      story.chooseChoiceIndex(0); // Choose first option

      final policyText = story.continueMaximally();
      expect(policyText, contains('Cabinet Room'));
      expect(policyText, contains('energy bill'));

      // Budget should be shown in text (100 or 95 depending on choice)
      expect(policyText, anyOf(contains('100'), contains('95')));
    });

    test('green energy choice costs budget', () {
      final context = fromJsonTestContext('president_game', 'game');
      final story = context.story!;

      // Morning briefing - choose UFO (doesn't affect budget)
      story.continueMaximally();
      story.chooseChoiceIndex(1);

      // Policy meeting
      story.continueMaximally();

      // Find green energy option
      final greenIndex = story.currentChoices
          .indexWhere((c) => c.text!.contains('green energy'));
      if (greenIndex >= 0) {
        final initialBudget = story.variablesState!['budget'] as int;
        story.chooseChoiceIndex(greenIndex);
        story.continueMaximally();

        expect(story.variablesState!['budget'], equals(initialBudget - 30));
        expect(story.variablesState!['progressive_support'], equals(65)); // +15
      }
    });

    test('full game day cycle works', () {
      final context = fromJsonTestContext('president_game', 'game');
      final story = context.story!;

      // Day 1: Morning briefing
      story.continueMaximally();
      expect(story.variablesState!['current_activity'], equals('intelligence_briefing'));
      expect(story.currentChoices.length, greaterThanOrEqualTo(2));
      story.chooseChoiceIndex(0);

      // Policy meeting
      story.continueMaximally();
      expect(story.variablesState!['current_activity'], equals('policy_meeting'));
      story.chooseChoiceIndex(0);

      // Diplomatic engagement
      story.continueMaximally();
      expect(story.variablesState!['current_activity'], equals('diplomatic_engagement'));
      story.chooseChoiceIndex(0);

      // Public address
      story.continueMaximally();
      expect(story.variablesState!['current_activity'], equals('public_address'));
      story.chooseChoiceIndex(0);

      // Crisis management
      story.continueMaximally();
      expect(story.variablesState!['current_activity'], equals('crisis_management'));
      story.chooseChoiceIndex(0);

      // Strategic planning
      story.continueMaximally();
      expect(story.variablesState!['current_activity'], equals('strategic_planning'));
      story.chooseChoiceIndex(0);

      // End day - should advance to day 2
      story.continueMaximally();
      expect(story.variablesState!['day'], equals(2));
    });

    test('game ends on low approval', () {
      final context = fromJsonTestContext('president_game', 'game');
      final story = context.story!;

      // Manually set approval very low to test game over
      // Must be low enough that even positive choices don't bring it above 20
      story.variablesState!['public_approval'] = -50;

      // Complete a day cycle
      story.continueMaximally();
      story.chooseChoiceIndex(0);
      story.continueMaximally();
      story.chooseChoiceIndex(0);
      story.continueMaximally();
      story.chooseChoiceIndex(0);
      story.continueMaximally();
      story.chooseChoiceIndex(0);
      story.continueMaximally();
      story.chooseChoiceIndex(0);
      story.continueMaximally();
      story.chooseChoiceIndex(0);

      final endText = story.continueMaximally();
      expect(story.variablesState!['game_over'], equals(true));
      expect(endText, contains('Impeached'));
    });

    test('game ends on high legacy', () {
      final context = fromJsonTestContext('president_game', 'game');
      final story = context.story!;

      // Set legacy very high to test win condition
      story.variablesState!['legacy_points'] = 55;

      // Complete a day cycle
      story.continueMaximally();
      story.chooseChoiceIndex(0);
      story.continueMaximally();
      story.chooseChoiceIndex(0);
      story.continueMaximally();
      story.chooseChoiceIndex(0);
      story.continueMaximally();
      story.chooseChoiceIndex(0);
      story.continueMaximally();
      story.chooseChoiceIndex(0);
      story.continueMaximally();
      story.chooseChoiceIndex(0);

      final endText = story.continueMaximally();
      expect(story.variablesState!['game_over'], equals(true));
      expect(endText, contains('Reelected'));
    });

    test('faction support changes based on choices', () {
      final context = fromJsonTestContext('president_game', 'game');
      final story = context.story!;

      final initialConservative = story.variablesState!['conservative_support'] as int;
      final initialProgressive = story.variablesState!['progressive_support'] as int;

      // Morning briefing
      story.continueMaximally();
      story.chooseChoiceIndex(1); // UFO investigation

      // Policy meeting - choose green energy if available
      story.continueMaximally();
      final greenIndex = story.currentChoices.indexWhere((c) => c.text!.contains('green'));
      if (greenIndex >= 0) {
        story.chooseChoiceIndex(greenIndex);
        story.continueMaximally();

        // Progressive support should increase
        expect(story.variablesState!['progressive_support'],
            greaterThan(initialProgressive));
      }
    });
  });

  group('President Game - Conditional Choices', () {
    test('high intelligence unlocks special choice', () {
      final context = fromJsonTestContext('president_game', 'game');
      final story = context.story!;

      // Set intelligence high enough for special choice
      story.variablesState!['intelligence'] = 85;

      story.continueMaximally();

      // Should have 3 choices including the intelligence-gated one
      final choiceTexts = story.currentChoices.map((c) => c.text).toList();
      expect(choiceTexts, contains(contains('classified data')));
    });

    test('low intelligence hides special choice', () {
      final context = fromJsonTestContext('president_game', 'game');
      final story = context.story!;

      // Intelligence is already 70, below 80 threshold
      story.continueMaximally();

      // Should only have 2 choices
      expect(story.currentChoices.length, equals(2));
      final choiceTexts = story.currentChoices.map((c) => c.text).toList();
      expect(choiceTexts, isNot(contains(contains('classified data'))));
    });

    test('high charisma unlocks compromise option', () {
      final context = fromJsonTestContext('president_game', 'game');
      final story = context.story!;

      // Set charisma high
      story.variablesState!['charisma'] = 65;

      // Get to policy meeting
      story.continueMaximally();
      story.chooseChoiceIndex(0);
      story.continueMaximally();

      // Should have compromise option
      final choiceTexts = story.currentChoices.map((c) => c.text).toList();
      expect(choiceTexts, contains(contains('compromise')));
    });
  });
}
