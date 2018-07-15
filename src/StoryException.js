export class StoryException extends Error{
	constructor(message) {
		super(message);
		this.useEndLineNumber = false;
		this.message = message;
		this.name = 'StoryException';
	}
}
