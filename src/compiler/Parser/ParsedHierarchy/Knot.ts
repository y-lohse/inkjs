import { Argument } from "./Argument";
import { FlowBase } from "./Flow/FlowBase";
import { FlowLevel } from "./Flow/FlowLevel";
import { Identifier } from "./Identifier";
import { ParsedObject } from "./Object";
import { Story } from "./Story";

export class Knot extends FlowBase {
  get flowLevel(): FlowLevel {
    return FlowLevel.Knot;
  }

  constructor(
    name: Identifier,
    topLevelObjects: ParsedObject[],
    args: Argument[],
    isFunction: boolean
  ) {
    super(name, topLevelObjects, args, isFunction);
  }

  get typeName(): string {
    return this.isFunction ? "Function" : "Knot";
  }

  public ResolveReferences(context: Story): void {
    super.ResolveReferences(context);

    let parentStory = this.story;

    // Enforce rule that stitches must not have the same
    // name as any knots that exist in the story
    for (const stitchName in this.subFlowsByName) {
      const knotWithStitchName = parentStory.ContentWithNameAtLevel(
        stitchName,
        FlowLevel.Knot,
        false
      );

      if (knotWithStitchName) {
        const stitch = this.subFlowsByName.get(stitchName);
        const errorMsg = `Stitch '${
          stitch ? stitch.name : "NO STITCH FOUND"
        }' has the same name as a knot (on ${
          knotWithStitchName.debugMetadata
        })`;
        this.Error(errorMsg, stitch);
      }
    }
  }
}
