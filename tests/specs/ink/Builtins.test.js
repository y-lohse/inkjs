var testsUtils = require('../../common.js');

describe('Builtins', () => {

	var story;

	function loadStory(name) {
		story = testsUtils.loadInkFile(name, "builtins");
		story.allowExternalFunctionFallbacks = true;
	}

	beforeEach(() => {
		story = undefined;
	});

	xtest('floor, ceiling and casts', () => {
		loadStory("floor_ceiling_and_casts");
		expect(story.ContinueMaximally()).toBe("1\n1\n2\n0.666667\n0\n1\n");
	});

	test('read count accross callstack', () => {
		loadStory("read_count_across_callstack");
		expect(story.ContinueMaximally()).toBe("1) Seen first 1 times.\nIn second.\n2) Seen first 1 times.\n");
	});

	test('read count accross threads', () => {
		loadStory("read_count_across_threads");
		expect(story.ContinueMaximally()).toBe("1\n1\n");
	});

	test('read count dot deperated path', () => {
		loadStory("read_count_dot_separated_path");
		expect(story.ContinueMaximally()).toBe("hi\nhi\nhi\n3\n");
	});

	test('nested turns since', () => {
		loadStory("turns_since_nested");

		expect(story.ContinueMaximally()).toBe("-1 = -1\n");

		expect(story.currentChoices.length).toBe(1);
		story.ChooseChoiceIndex(0);
		expect(story.ContinueMaximally()).toBe("stuff\n0 = 0\n");

		expect(story.currentChoices.length).toBe(1);
		story.ChooseChoiceIndex(0);
		expect(story.ContinueMaximally()).toBe("more stuff\n1 = 1\n");
	});

	test('nested turns since', () => {
		loadStory("turns_since_with_variable_target");

		expect(story.ContinueMaximally()).toBe("0\n0\n");

		expect(story.currentChoices.length).toBe(1);
		story.ChooseChoiceIndex(0);
		expect(story.ContinueMaximally()).toBe("1\n");
	});

	test('turns since', () => {
		loadStory("turns_since");

		expect(story.ContinueMaximally()).toBe("-1\n0\n");

		story.ChooseChoiceIndex(0);
		expect(story.ContinueMaximally()).toBe("1\n");

		story.ChooseChoiceIndex(0);
		expect(story.ContinueMaximally()).toBe("2\n");
	});

	test('turns', () => {
		loadStory("turns");

		for (let i; i < 10; i++) {
			expect(story.continue()).toBe(`${i}\n`);
			story.ChooseChoiceIndex(0);
		}
	});

	test('visit counts when choosing', () => {
		loadStory("visit_counts_when_choosing");

		expect(story.state.VisitCountAtPathString("TestKnot")).toBe(0);
		expect(story.state.VisitCountAtPathString("TestKnot2")).toBe(0);

		story.ChoosePathString("TestKnot");

		expect(story.state.VisitCountAtPathString("TestKnot")).toBe(1);
		expect(story.state.VisitCountAtPathString("TestKnot2")).toBe(0);

		story.Continue();

		expect(story.state.VisitCountAtPathString("TestKnot")).toBe(1);
		expect(story.state.VisitCountAtPathString("TestKnot2")).toBe(0);

		story.ChooseChoiceIndex(0)

		expect(story.state.VisitCountAtPathString("TestKnot")).toBe(1);
		expect(story.state.VisitCountAtPathString("TestKnot2")).toBe(0);

		story.Continue()

		expect(story.state.VisitCountAtPathString("TestKnot")).toBe(1);
		expect(story.state.VisitCountAtPathString("TestKnot2")).toBe(1);
	});
});
