export class StoryException extends Error {
  public useEndLineNumber: boolean;
  public message: string;
  public name: string;

  constructor(message: string) {
    super(message);
    this.useEndLineNumber = false;
    this.message = message;
    this.name = "StoryException";
  }
}
