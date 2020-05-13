var testsUtils = require('../../common.js');

describe('Sequences', () => {

	var story;

	function loadStory(name) {
		story = testsUtils.loadInkFile(name, "sequences");
	}

	beforeEach(() => {
		story = undefined;
	});

	it('tests blanks in inline sequences', () => {
		loadStory("blanks_in_inline_sequences");
		expect(story.ContinueMaximally()).toBe("1. a\n2.\n3. b\n4. b\n---\n1.\n2. a\n3. a\n---\n1. a\n2.\n3.\n---\n1.\n2.\n3.\n");
	});

	it('tests blanks in inline sequences', () => {
		loadStory("empty_sequence_content");
		expect(story.ContinueMaximally()).toBe("Wait for it....\nSurprise!\nDone.\n");
	});

	it('tests gather read count with initial sequence', () => {
		loadStory("gather_read_count_with_initial_sequence");
		expect(story.Continue()).toBe("seen test\n");
	});

	it('tests leading newline multiline sequence', () => {
		loadStory("leading_newline_multiline_sequence");
		expect(story.Continue()).toBe("a line after an empty line\n");
	});

	it('tests shuffle stack muddying', () => {
		loadStory("shuffle_stack_muddying");

		story.Continue();

		expect(story.currentChoices.length).toBe(2);
	});

	xit('tests all sequence type', () => { // Only available in 0.9.0
		loadStory("all_sequence_types");
	});
});
