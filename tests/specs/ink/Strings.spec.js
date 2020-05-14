let testsUtils = require('../../common.js');

describe('Strings', () => {

	let story;

	function loadStory(name) {
		story = testsUtils.loadInkFile(name, "strings");
	}

	beforeEach(() => {
		story = undefined;
	});

	it('tests string constants', () => {
		loadStory("string_constants");

		expect(story.Continue()).toBe("hi\n");
	});

	it('tests string contains', () => {
		loadStory("string_contains");

		expect(story.ContinueMaximally()).toBe("1\n0\n1\n1\n");
	});

	it('tests string type coercion', () => {
		loadStory("string_type_coercion");

		expect(story.ContinueMaximally()).toBe("same\ndifferent\n");
	});

	it('tests string in choices', () => {
		loadStory("strings_in_choices");

		story.ContinueMaximally();

		expect(story.currentChoices.length).toBe(1);
		expect(story.currentChoices[0].text).toBe("test1 \"test2 test3\"");

		story.ChooseChoiceIndex(0)
		expect(story.Continue()).toBe("test1 test4\n");
	});
});
