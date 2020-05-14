let testsUtils = require('../../common.js');

describe('Callstack', () => {

	let story;

	function loadStory(name) {
		story = testsUtils.loadInkFile(name, "callstack");
	}

	beforeEach(() => {
		story = undefined;
	});

	it('tests call stack evaluation', () => {
		loadStory("call_stack_evaluation");
		expect(story.Continue()).toBe("8\n");
	});

	it('tests clean callstack reset on path choice', () => {
		loadStory("clean_callstack_reset_on_path_choice");

		expect(story.Continue()).toBe("The first line.\n");

		story.ChoosePathString("SomewhereElse");

		expect(story.ContinueMaximally()).toBe("somewhere else\n");
	});
});
