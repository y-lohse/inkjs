import { InkObject } from "./Object";

// New version of tags is dynamic - it constructs the tags
// at runtime based on BeginTag and EndTag control commands.
// Plain text that's in the output stream is turned into tags
// when you do story.currentTags.
// The only place this is used is when flattening tags down
// to string in advance, during dynamic string generation if
// there's a tag embedded in it. See how ControlCommand.EndString
// is implemented in Story.cs for more details + comment
export class Tag extends InkObject {
  public readonly text: string;

  constructor(tagText: string) {
    super();
    this.text = tagText.toString() || "";
  }

  public toString(): string {
    return "# " + this.text;
  }
}
