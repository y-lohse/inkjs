var testsUtils = require('../../common.js');

describe('Bindings', () => {

	var story;

	function loadStory(name) {
		story = testsUtils.loadInkFile(name, "bindings");
	}

	beforeEach(() => {
		story = undefined;
	});

	xit('tests external bindings', () => {
		loadStory("external_binding");

		let testExternalBindingMessage = '';

		story.BindExternalFunction ("message", (arg) => {
			testExternalBindingMessage = "MESSAGE: " + arg;
		});

		story.BindExternalFunction ("multiply", (arg1, arg2) => {
			return arg1 * arg2;
		});

		story.BindExternalFunction ("times", (numberOfTimes, stringValue) => {
			let result = '';

			for (let i; i < numberOfTimes; i++) {
				result += stringValue;
			}

			return result;
		});

		expect(story.Continue()).toBe("15\n");
		expect(story.Continue()).toBe("knock knock knock\n");
		expect(testExternalBindingMessage).toBe("MESSAGE: hello world");
	});

	xit('tests game ink back and forth', () => {
		loadStory("game_ink_back_and_forth");

		story.BindExternalFunction ("gameInc", (x) => {
			x += 1;
			x = story.EvaluateFunction("inkInc", [x]);
		});

		let finalResult = story.EvaluateFunction("topExternal", [5], true);

		expect(finalResult['returned']).toBe(7);
		expect(finalResult['output']).toBe("In top external\n");
	});

	it('tests variable observer', () => {
		loadStory("variable_observer");

		let currentVarValue = 0;
		let observerCallCount = 0;

		story.ObserveVariable("testVar", (varName, newValue) => {
			currentVarValue = newValue;
			observerCallCount += 1;
		});

		story.ContinueMaximally();

		expect(currentVarValue).toBe(15);
		expect(observerCallCount).toBe(1);

		story.ChooseChoiceIndex(0);
		story.Continue();

		expect(currentVarValue).toBe(25);
		expect(observerCallCount).toBe(2);
	});
});
