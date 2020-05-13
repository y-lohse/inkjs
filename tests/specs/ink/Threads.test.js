var testsUtils = require('../../common.js');

describe('Threads', () => {

	var story;

	function loadStory(name) {
		story = testsUtils.loadInkFile(name, "threads");
	}

	beforeEach(() => {
		story = undefined;
	});

	test('multi threads', () => {
		loadStory("multi_thread");

		expect(story.ContinueMaximally()).toBe("This is place 1.\nThis is place 2.\n");

		story.ChooseChoiceIndex(0);
		expect(story.ContinueMaximally()).toBe("choice in place 1\nThe end\n");

		expect(story.hasError).toBe(false);
	});

	test('thread done', () => {
		loadStory("thread_done");

		expect(story.ContinueMaximally()).toBe("This is a thread example\nHello.\nThe example is now complete.\n");
	});

	test('thread in logic', () => {
		loadStory("thread_in_logic");

		expect(story.Continue()).toBe("Content\n");
	});

	test('top flow terminator should not kill thread choices', () => {
		loadStory("top_flow_terminator_should_not_kill_thread_choices");

		expect(story.Continue()).toBe("Limes\n");
		expect(story.currentChoices.length).toBe(1);
	});
});