var testsUtils = require('../../common.js');

describe('Lists', () => {

	var story;

	function loadStory(name) {
		story = testsUtils.loadInkFile(name, "lists");
	}

	beforeEach(() => {
		story = undefined;
	});

	test('empty list origin', () => {
		loadStory("empty_list_origin");

		expect(story.Continue()).toBe("a, b\n");
	});

	test('empty list origin', () => {
		loadStory("empty_list_origin_after_assignment");

		expect(story.ContinueMaximally()).toBe("a, b, c\n");
	});

	test('list basic operations', () => {
		loadStory("list_basic_operations");

		expect(story.ContinueMaximally()).toBe("b, d\na, b, c, e\nb, c\n0\n1\n1\n");
	});

	test('list mixed items', () => {
		loadStory("list_mixed_items");

		expect(story.ContinueMaximally()).toBe("a, y, c\n");
	});

	test('list random', () => {
		loadStory("list_random");

		while (story.canContinue) {
			let result = story.Continue();
			expect(result == "B\n" || result == "C\n" || result == "D\n").toBe(true);
		}
	});

	test('list range', () => {
		loadStory("list_range");

		expect(story.ContinueMaximally()).toBe("Pound, Pizza, Euro, Pasta, Dollar, Curry, Paella\nEuro, Pasta, Dollar, Curry\nTwo, Three, Four, Five, Six\nPizza, Pasta\n");
	});

	test('list save load', () => {
		loadStory("list_save_load");

		expect(story.ContinueMaximally()).toBe("a, x, c\n");

		let savedState = story.state.ToJson();

		loadStory("list_save_load");
		story.state.LoadJson(savedState);

		story.ChoosePathString("elsewhere");
		expect(story.ContinueMaximally()).toBe("a, x, c, z\n");
	});

	test('more list operations', () => {
		loadStory("more_list_operations");

		expect(story.ContinueMaximally()).toBe("1\nl\nn\nl, m\nn\n");
	});
});
