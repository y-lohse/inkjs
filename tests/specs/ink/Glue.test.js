var testsUtils = require('../../common.js');

describe('Glue', () => {

	var story;

	function loadStory(name) {
		story = testsUtils.loadInkFile(name, "glue");
	}

	beforeEach(() => {
		story = undefined;
	});

	test('implicit inline glue', () => {
		loadStory("implicit_inline_glue");

		expect(story.Continue()).toBe("I have five eggs.\n");
	});

	test('implicit inline glue b', () => {
		loadStory("implicit_inline_glue_b");

		expect(story.ContinueMaximally()).toBe("A\nX\n");
	});

	test('implicit inline glue c', () => {
		loadStory("implicit_inline_glue_c");

		expect(story.ContinueMaximally()).toBe("A\nC\n");
	});

	test('left right glue matching', () => {
		loadStory("left_right_glue_matching");

		expect(story.ContinueMaximally()).toBe("A line.\nAnother line.\n");
	});

	test('simple glue', () => {
		loadStory("simple_glue");

		expect(story.Continue()).toBe("Some content with glue.\n");
	});
});
