var testsUtils = require('../../common.js');

describe('Logic', () => {

	var story;

	function loadStory(name) {
		story = testsUtils.loadInkFile(name, "logic");
	}

	beforeEach(() => {
		story = undefined;
	});

	test('logic lines with newlines', () => {
		loadStory("logic_lines_with_newlines");

		expect(story.ContinueMaximally()).toBe("text1\ntext 2\ntext1\ntext 2\n");
	});

	test('multiline logic with glue', () => {
		loadStory("multiline_logic_with_glue");

		expect(story.ContinueMaximally()).toBe("a b\na b\n");
	});

	test('nested pass by reference', () => {
		loadStory("nested_pass_by_reference");

		expect(story.ContinueMaximally()).toBe("5\n625\n");
	});

	xtest('print num', () => {
		loadStory("print_num");

		expect(story.ContinueMaximally()).toBe(". four .\n. fifteen .\n. thirty-seven .\n. one hundred and one .\n. two hundred and twenty-two .\n. one thousand two hundred and thirty-four .\n");
	});
});
