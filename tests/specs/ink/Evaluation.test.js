var testsUtils = require('../../common.js');

describe('Evaluation', () => {

	var story;

	function loadStory(name) {
		story = testsUtils.loadInkFile(name, "evaluation");
	}

	beforeEach(() => {
		story = undefined;
	});

	xtest('arithmetic', () => {
		loadStory("arithmetic");

		expect(story.ContinueMaximally()).toBe("36\n2\n3\n2\n2.333333\n8\n8\n");
	});

	test('basic string literal', () => {
		loadStory("basic_string_literals");

		expect(story.ContinueMaximally()).toBe("Hello world 1\nHello world 2.\n");
	});

	test('evaluating function variable state bug', () => {
		loadStory("evaluating_function_variable_state_bug");

		expect(story.Continue()).toBe("Start\n");
		expect(story.Continue()).toBe("In tunnel.\n");

		var funcResult = story.EvaluateFunction("function_to_evaluate")
		expect(funcResult).toBe("RIGHT");
		expect(story.Continue()).toBe("End\n");
	});

	test('evaluating ink functions from game', () => {
		loadStory("evaluating_ink_functions_from_game");

		story.Continue();

		var returnedDivertTarget = story.EvaluateFunction("test")

		expect(returnedDivertTarget).toBe("somewhere.here");
	});

	test('evaluating ink functions from game 2', () => {
		loadStory("evaluating_ink_functions_from_game_2");

		var funcResult = story.EvaluateFunction("func1", [], true)

		expect(funcResult['output']).toBe("This is a function\n");
		expect(funcResult['returned']).toBe(5);

		expect(story.Continue()).toBe("One\n");

		var funcResult = story.EvaluateFunction("func2", [], true)

		expect(funcResult['output']).toBe("This is a function without a return value\n");
		expect(funcResult['returned']).toBe(null);

		expect(story.Continue()).toBe("Two\n");

		var funcResult = story.EvaluateFunction("add", [1, 2], true)

		expect(funcResult['output']).toBe("x = 1, y = 2\n");
		expect(funcResult['returned']).toBe(3);

		expect(story.Continue()).toBe("Three\n");
	});

	test('evaluating stack leaks', () => {
		loadStory("evaluation_stack_leaks");

		expect(story.ContinueMaximally()).toBe("else\nelse\nhi\n");
		expect(story.state.evaluationStack.length).toBe(0);
	});

	test('factorial by reference', () => {
		loadStory("factorial_by_reference");

		expect(story.ContinueMaximally()).toBe("120\n");
	});

	test('factorial recursive', () => {
		loadStory("factorial_recursive");

		expect(story.ContinueMaximally()).toBe("120\n");
	});

	test('increment', () => {
		loadStory("increment");

		expect(story.ContinueMaximally()).toBe("6\n5\n");
	});

	test('literal unary', () => {
		loadStory("literal_unary");

		expect(story.ContinueMaximally()).toBe("-1\n0\n1\n");
	});
});
