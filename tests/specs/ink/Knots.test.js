var testsUtils = require('../../common.js');

describe('Knots', () => {

	var story;

	function loadStory(name) {
		story = testsUtils.loadInkFile(name, "knots");
	}

	beforeEach(() => {
		story = undefined;
	});

	test('knot do not gather', () => {
		loadStory("knot_do_not_gather");

		expect(story.Continue()).toBe("g\n");
	});

	test('knot stitch gather counts', () => {
		loadStory("knot_stitch_gather_counts");

		expect(story.ContinueMaximally()).toBe("1 1\n2 2\n3 3\n1 1\n2 1\n3 1\n1 2\n2 2\n3 2\n1 1\n2 1\n3 1\n1 2\n2 2\n3 2\n");
	});

	test('knot thread interaction', () => {
		loadStory("knot_thread_interaction");

		expect(story.ContinueMaximally()).toBe("blah blah\n");

		expect(story.currentChoices.length).toBe(2);
		expect(story.currentChoices[0].text).toMatch("option");
		expect(story.currentChoices[1].text).toMatch("wigwag");

		story.ChooseChoiceIndex(1);

		expect(story.Continue()).toBe("wigwag\n");
		expect(story.Continue()).toBe("THE END\n");
		expect(story.hasError);
	});

	test('knot thread interaction2', () => {
		loadStory("knot_thread_interaction_2");

		expect(story.ContinueMaximally()).toBe("I’m in a tunnel\nWhen should this get printed?\n");

		expect(story.currentChoices.length).toBe(1);
		expect(story.currentChoices[0].text).toBe("I’m an option");

		story.ChooseChoiceIndex(0);

		expect(story.ContinueMaximally()).toBe("I’m an option\nFinishing thread.\n");
		expect(story.hasError);
	});
});
