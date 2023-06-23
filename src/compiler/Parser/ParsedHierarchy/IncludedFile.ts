import { ParsedObject } from "./Object";
import { InkObject as RuntimeObject } from "../../../engine/Object";
import { Story } from "./Story";

export class IncludedFile extends ParsedObject {
  constructor(public readonly includedStory: Story | null) {
    super();
  }

  public readonly GenerateRuntimeObject = (): RuntimeObject | null => {
    // Left to the main story to process
    return null;
  };

  get typeName(): string {
    return "IncludedFile";
  }
}
