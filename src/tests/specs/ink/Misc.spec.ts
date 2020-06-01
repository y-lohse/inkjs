import * as testsUtils from '../common';

describe('Misc', () => {

	let story: any;

	function loadStory(name: any) {
		story = testsUtils.loadInkFile(name, 'misc');
	}

	beforeEach(() => {
		story = undefined;
	});

	it('tests empty', () => {
		loadStory('empty');

		expect(story.ContinueMaximally()).toBe('');
	});

	it('tests end of content', () => {
		loadStory('end_of_content');

		story.ContinueMaximally();
		expect(story.hasError).toBe(false);
	});

	it('tests end', () => {
		loadStory('end');

		expect(story.ContinueMaximally()).toBe('hello\n');
	});

	it('tests end 2', () => {
		loadStory('end2');

		expect(story.ContinueMaximally()).toBe('hello\n');
	});

	it('tests escape characters', () => {
		loadStory('escape_character');

		expect(story.ContinueMaximally()).toBe("this is a '|' character\n");
	});

	it('tests hello world', () => {
		loadStory('hello_world');

		expect(story.Continue()).toBe('Hello world\n');
	});

	it('tests identifiers can start with numbers', () => {
		loadStory('identifiers_can_start_with_number');

		expect(story.ContinueMaximally()).toBe('512x2 = 1024\n512x2p2 = 1026\n');
	});

	it('tests include', () => {
		loadStory('include');

		expect(story.ContinueMaximally()).toBe('This is include 1.\nThis is include 2.\nThis is the main file.\n');
	});

	it('tests nested include', () => {
		loadStory('nested_include');

		expect(story.ContinueMaximally()).toBe('The value of a variable in test file 2 is 5.\nThis is the main file\nThe value when accessed from knot_in_2 is 5.\n');
	});

	it('tests quote character significance', () => {
		loadStory('quote_character_significance');

		expect(story.ContinueMaximally()).toBe('My name is "Joe"\n');
	});

	it('tests whitespace', () => {
		loadStory('whitespace');

		expect(story.ContinueMaximally()).toBe('Hello!\nWorld.\n');
	});
});
