var testsUtils = require('../../common.js');

describe('Callstack', () => {

	var story;

	function loadStory(name) {
		story = testsUtils.loadInkFile(name, "callstack");
		story.allowExternalFunctionFallbacks = true;
	}

	beforeEach(() => {
		story = undefined;
	});

	test('call stack evaluation', () => {
		loadStory("call_stack_evaluation");
		expect(story.Continue()).toBe("8\n");
	});

	test('clean callstack reset on path choice', () => {
		loadStory("clean_callstack_reset_on_path_choice");

		expect(story.Continue()).toBe("The first line.\n");

		story.ChoosePathString("SomewhereElse");

		expect(story.ContinueMaximally()).toBe("somewhere else\n");
	});
});
