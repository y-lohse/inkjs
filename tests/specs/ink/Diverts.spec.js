var testsUtils = require('../../common.js');

describe('Diverts', () => {

	var story;

	function loadStory(name) {
		story = testsUtils.loadInkFile(name, "diverts");
	}

	beforeEach(() => {
		story = undefined;
	});

	it('tests basic tunnel', () => {
		loadStory("basic_tunnel");

		expect(story.Continue()).toBe("Hello world\n");
	});

	it('tests compare divert targets', () => {
		loadStory("compare_divert_targets");

		expect(story.ContinueMaximally()).toBe("different knot\nsame knot\nsame knot\ndifferent knot\nsame knot\nsame knot\n");
	});

	it('tests complex tunnels', () => {
		loadStory("complex_tunnels");

		expect(story.ContinueMaximally()).toBe("one (1)\none and a half (1.5)\ntwo (2)\nthree (3)\n");
	});

	it('tests divert in conditional', () => {
		loadStory("divert_in_conditional");

		expect(story.ContinueMaximally()).toBe("");
	});

	it('tests divert targets with parameters', () => {
		loadStory("divert_targets_with_parameters");

		expect(story.ContinueMaximally()).toBe("5\n");
	});

	it('tests divert to weave points', () => {
		loadStory("divert_to_weave_points");

		expect(story.ContinueMaximally()).toBe("gather\ntest\nchoice content\ngather\nsecond time round\n");
	});

	it('tests done stop thread', () => {
		loadStory("done_stops_thread");

		expect(story.ContinueMaximally()).toBe("");
	});

	it('tests path to self', () => {
		loadStory("path_to_self");

		story.Continue();
		story.ChooseChoiceIndex(0);

		story.Continue();
		story.ChooseChoiceIndex(0);

		expect(story.canContinue).toBe(true);
	});

	it('tests same line divert is inline', () => {
		loadStory("same_line_divert_is_inline");

		expect(story.Continue()).toBe("We hurried home to Savile Row as fast as we could.\n");
	});

	it('tests tunnel onwards after tunnel', () => {
		loadStory("tunnel_onwards_after_tunnel");

		expect(story.ContinueMaximally()).toBe("Hello...\n...world.\nThe End.\n");
	});

	it('tests tunnel onwards divert after with arg', () => {
		loadStory("tunnel_onwards_divert_after_with_arg");

		expect(story.ContinueMaximally()).toBe("8\n");
	});

	it('tests tunnel onwards divert override', () => {
		loadStory("tunnel_onwards_divert_override");

		expect(story.ContinueMaximally()).toBe("This is A\nNow in B.\n");
	});

	it('tests tunnel onwardswith param default choice', () => {
		loadStory("tunnel_onwards_with_param_default_choice");

		expect(story.ContinueMaximally()).toBe("8\n");
	});

	it('tests tunnel vs thread behaviour', () => {
		loadStory("tunnel_vs_thread_behaviour");

		expect(story.ContinueMaximally()).not.toMatch("Finished tunnel");
		expect(story.currentChoices.length).toBe(2);

		story.ChooseChoiceIndex(0);

		expect(story.ContinueMaximally()).toMatch("Finished tunnel");
		expect(story.currentChoices.length).toBe(3);

		story.ChooseChoiceIndex(2);

		expect(story.ContinueMaximally()).toMatch("Done.");
	});
});
