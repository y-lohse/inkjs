var testsUtils = require('../../common.js');

describe('Weaves', () => {

	var story;

	function loadStory(name) {
		story = testsUtils.loadInkFile(name, "weaves");
	}

	beforeEach(() => {
		story = undefined;
	});

	test('conditional choice in weave', () => {
		loadStory("conditional_choice_in_weave");

		expect(story.ContinueMaximally()).toBe("start\ngather should be seen\n");
		expect(story.currentChoices.length).toBe(1);
		expect(story.currentChoices[0].text).toBe("go to a stitch");

		story.ChooseChoiceIndex(0);

		expect(story.ContinueMaximally()).toBe("result\n");
	});

	test('conditional choice in weave 2', () => {
		loadStory("conditional_choice_in_weave_2");

		expect(story.Continue()).toBe("first gather\n");
		expect(story.currentChoices.length).toBe(2);

		story.ChooseChoiceIndex(0);

		expect(story.ContinueMaximally()).toBe("the main gather\nbottom gather\n");
		expect(story.currentChoices.length).toBe(0);
	});

	test('unbalanced weave indentation', () => {
		loadStory("unbalanced_weave_indentation");

		story.ContinueMaximally();

		expect(story.currentChoices.length).toBe(1);
		expect(story.currentChoices[0].text).toBe("First");

		story.ChooseChoiceIndex(0);
		expect(story.ContinueMaximally()).toBe("First\n");
		expect(story.currentChoices.length).toBe(1);
		expect(story.currentChoices[0].text).toBe("Very indented");

		story.ChooseChoiceIndex(0);
		expect(story.ContinueMaximally()).toBe("Very indented\nEnd\n");
		expect(story.currentChoices.length).toBe(0);
	});

	test('weave gathers', () => {
		loadStory("weave_gathers");

		story.ContinueMaximally();

		expect(story.currentChoices.length).toBe(2);
		expect(story.currentChoices[0].text).toBe("one");
		expect(story.currentChoices[1].text).toBe("four");

		story.ChooseChoiceIndex(0);
		story.ContinueMaximally();

		expect(story.currentChoices.length).toBe(1);
		expect(story.currentChoices[0].text).toBe("two");

		story.ChooseChoiceIndex(0);
		expect(story.ContinueMaximally()).toBe("two\nthree\nsix\n");
	});

	test('weave options', () => {
		loadStory("weave_options");

		story.ContinueMaximally();
		expect(story.currentChoices[0].text).toBe("Hello.");

		story.ChooseChoiceIndex(0);
		expect(story.Continue()).toBe("Hello, world.\n");
	});

	test('weave within sequence', () => {
		loadStory("weave_within_sequence");

		story.Continue();
		expect(story.currentChoices.length).toBe(1);

		story.ChooseChoiceIndex(0);
		expect(story.ContinueMaximally()).toBe("choice\nnextline\n");
	});
});
