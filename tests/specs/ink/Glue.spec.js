let testsUtils = require('../../common.js');

describe('Glue', () => {

	let story;

	function loadStory(name) {
		story = testsUtils.loadInkFile(name, "glue");
	}

	beforeEach(() => {
		story = undefined;
	});

	it('tests implicit inline glue', () => {
		loadStory("implicit_inline_glue");

		expect(story.Continue()).toBe("I have five eggs.\n");
	});

	it('tests implicit inline glue b', () => {
		loadStory("implicit_inline_glue_b");

		expect(story.ContinueMaximally()).toBe("A\nX\n");
	});

	it('tests implicit inline glue c', () => {
		loadStory("implicit_inline_glue_c");

		expect(story.ContinueMaximally()).toBe("A\nC\n");
	});

	it('tests left right glue matching', () => {
		loadStory("left_right_glue_matching");

		expect(story.ContinueMaximally()).toBe("A line.\nAnother line.\n");
	});

	it('tests simple glue', () => {
		loadStory("simple_glue");

		expect(story.Continue()).toBe("Some content with glue.\n");
	});
});
