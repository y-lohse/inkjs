export class StoryException extends Error{
	constructor(message) {
		super(message);
		this.message = message;
		this.name = 'StoryException';
	}
}