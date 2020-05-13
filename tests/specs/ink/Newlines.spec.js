var testsUtils = require('../../common.js');

describe('Newlines', () => {

	var story;

	function loadStory(name) {
		story = testsUtils.loadInkFile(name, "newlines");
	}

	beforeEach(() => {
		story = undefined;
	});

	it('tests newline at start of multiline conditional', () => {
		loadStory("newline_at_start_of_multiline_conditional");

		expect(story.ContinueMaximally()).toBe("X\nx\n");
	});

	it('tests newline consistency', () => {
		loadStory("newline_consistency_1");
		expect(story.ContinueMaximally()).toBe("hello world\n");

		loadStory("newline_consistency_2");
		story.Continue();
		story.ChooseChoiceIndex(0);
		expect(story.ContinueMaximally()).toBe("hello world\n");

		loadStory("newline_consistency_3");
		story.Continue();
		story.ChooseChoiceIndex(0);
		expect(story.ContinueMaximally()).toBe("hello\nworld\n");
	});

	it('tests newlines trimming with func external fallback', () => {
		loadStory("newlines_trimming_with_func_external_fallback");
		story.allowExternalFunctionFallbacks = true;

		expect(story.ContinueMaximally()).toBe("Phrase 1\nPhrase 2\n");
	});

	it('tests newlines trimming with string eval', () => {
		loadStory("newlines_with_string_eval");

		expect(story.ContinueMaximally()).toBe("A\nB\nA\n3\nB\n");
	});
});
