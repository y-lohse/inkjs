var testsUtils = require('../../common.js');

describe('Tags', () => {

	var story;

	function loadStory(name) {
		story = testsUtils.loadInkFile(name, "tags");
	}

	beforeEach(() => {
		story = undefined;
	});

	test('string constants', () => {
		loadStory("tags");

		let globalTags = ["author: Joe", "title: My Great Story"];
		let knotTags = ["knot tag"];
		let knotTagsWhenContinuedTwiceTags = ["end of knot tag"];
		let stitchTags = ["stitch tag"]

		expect(story.globalTags).toEqual(globalTags);
		expect(story.Continue()).toBe("This is the content\n");
		expect(story.currentTags).toEqual(globalTags);

		expect(story.TagsForContentAtPath("knot")).toEqual(knotTags);
		expect(story.TagsForContentAtPath("knot.stitch")).toEqual(stitchTags);

		story.ChoosePathString("knot");
		expect(story.Continue()).toBe("Knot content\n");
		expect(story.currentTags).toEqual(knotTags);
		expect(story.Continue()).toBe("");
		expect(story.currentTags).toEqual(knotTagsWhenContinuedTwiceTags);
	});

	test('tag on choice', () => {
		loadStory("tags_on_choice");

		story.Continue()
		story.ChooseChoiceIndex(0);

		let txt = story.Continue()
		let tags = story.currentTags

		expect(txt).toEqual("Hello");
		expect(tags.length).toEqual(1);
		expect(tags[0]).toEqual("hey");
	});
});
