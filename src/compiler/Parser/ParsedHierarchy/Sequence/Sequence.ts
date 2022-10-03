import { ContentList } from "../ContentList";
import { Container as RuntimeContainer } from "../../../../engine/Container";
import { ControlCommand as RuntimeControlCommand } from "../../../../engine/ControlCommand";
import { Divert as RuntimeDivert } from "../../../../engine/Divert";
import { IntValue } from "../../../../engine/Value";
import { NativeFunctionCall } from "../../../../engine/NativeFunctionCall";
import { ParsedObject } from "../Object";
import { InkObject as RuntimeObject } from "../../../../engine/Object";
import { SequenceDivertToResolve } from "./SequenceDivertToResolve";
import { SequenceType } from "./SequenceType";
import { Story } from "../Story";
import { Weave } from "../Weave";

export class Sequence extends ParsedObject {
  private _sequenceDivertsToResolve: SequenceDivertToResolve[] = [];

  public sequenceElements: ParsedObject[];

  constructor(
    elementContentLists: ContentList[],
    public readonly sequenceType: SequenceType
  ) {
    super();

    this.sequenceType = sequenceType;
    this.sequenceElements = [];

    for (const elementContentList of elementContentLists) {
      const contentObjs = elementContentList.content;
      let seqElObject: ParsedObject | null = null;

      // Don't attempt to create a weave for the sequence element
      // if the content list is empty. Weaves don't like it!
      if (contentObjs === null || contentObjs.length === 0) {
        seqElObject = elementContentList;
      } else {
        seqElObject = new Weave(contentObjs);
      }

      this.sequenceElements.push(seqElObject);
      this.AddContent(seqElObject);
    }
  }

  get typeName(): string {
    return "Sequence";
  }

  // Generate runtime code that looks like:
  //
  //   chosenIndex = MIN(sequence counter, num elements) e.g. for "Stopping"
  //   if chosenIndex == 0, divert to s0
  //   if chosenIndex == 1, divert to s1  [etc]
  //
  //   - s0:
  //      <content for sequence element>
  //      divert to no-op
  //   - s1:
  //      <content for sequence element>
  //      divert to no-op
  //   - s2:
  //      empty branch if using "once"
  //      divert to no-op
  //
  //    no-op
  //
  public readonly GenerateRuntimeObject = (): RuntimeObject => {
    const container = new RuntimeContainer();
    container.visitsShouldBeCounted = true;
    container.countingAtStartOnly = true;

    this._sequenceDivertsToResolve = [];

    // Get sequence read count
    container.AddContent(RuntimeControlCommand.EvalStart());
    container.AddContent(RuntimeControlCommand.VisitIndex());

    const once: boolean = (this.sequenceType & SequenceType.Once) > 0;
    const cycle: boolean = (this.sequenceType & SequenceType.Cycle) > 0;
    const stopping: boolean = (this.sequenceType & SequenceType.Stopping) > 0;
    const shuffle: boolean = (this.sequenceType & SequenceType.Shuffle) > 0;

    let seqBranchCount = this.sequenceElements.length;
    if (once) {
      seqBranchCount += 1;
    }

    // Chosen sequence index:
    //  - Stopping: take the MIN(read count, num elements - 1)
    //  - Once: take the MIN(read count, num elements)
    //    (the last one being empty)
    if (stopping || once) {
      //var limit = stopping ? seqBranchCount-1 : seqBranchCount;
      container.AddContent(new IntValue(seqBranchCount - 1));
      container.AddContent(NativeFunctionCall.CallWithName("MIN"));
    } else if (cycle) {
      // - Cycle: take (read count % num elements)
      container.AddContent(new IntValue(this.sequenceElements.length));
      container.AddContent(NativeFunctionCall.CallWithName("%"));
    }

    // Shuffle
    if (shuffle) {
      // Create point to return to when sequence is complete
      const postShuffleNoOp = RuntimeControlCommand.NoOp();

      // When visitIndex == lastIdx, we skip the shuffle
      if (once || stopping) {
        // if( visitIndex == lastIdx ) -> skipShuffle
        const lastIdx = stopping
          ? this.sequenceElements.length - 1
          : this.sequenceElements.length;

        container.AddContent(RuntimeControlCommand.Duplicate());
        container.AddContent(new IntValue(lastIdx));
        container.AddContent(NativeFunctionCall.CallWithName("=="));

        const skipShuffleDivert = new RuntimeDivert();
        skipShuffleDivert.isConditional = true;
        container.AddContent(skipShuffleDivert);

        this.AddDivertToResolve(skipShuffleDivert, postShuffleNoOp);
      }

      // This one's a bit more complex! Choose the index at runtime.
      let elementCountToShuffle = this.sequenceElements.length;
      if (stopping) {
        elementCountToShuffle -= 1;
      }

      container.AddContent(new IntValue(elementCountToShuffle));
      container.AddContent(RuntimeControlCommand.SequenceShuffleIndex());
      if (once || stopping) {
        container.AddContent(postShuffleNoOp);
      }
    }

    container.AddContent(RuntimeControlCommand.EvalEnd());

    // Create point to return to when sequence is complete
    const postSequenceNoOp = RuntimeControlCommand.NoOp();

    // Each of the main sequence branches, and one extra empty branch if
    // we have a "once" sequence.
    for (let elIndex = 0; elIndex < seqBranchCount; elIndex += 1) {
      // This sequence element:
      //  if( chosenIndex == this index ) divert to this sequence element
      // duplicate chosen sequence index, since it'll be consumed by "=="
      container.AddContent(RuntimeControlCommand.EvalStart());
      container.AddContent(RuntimeControlCommand.Duplicate());
      container.AddContent(new IntValue(elIndex));
      container.AddContent(NativeFunctionCall.CallWithName("=="));
      container.AddContent(RuntimeControlCommand.EvalEnd());

      // Divert branch for this sequence element
      const sequenceDivert = new RuntimeDivert();
      sequenceDivert.isConditional = true;
      container.AddContent(sequenceDivert);

      let contentContainerForSequenceBranch: RuntimeContainer;

      // Generate content for this sequence element
      if (elIndex < this.sequenceElements.length) {
        const el = this.sequenceElements[elIndex];
        contentContainerForSequenceBranch =
          el.runtimeObject as RuntimeContainer;
      } else {
        // Final empty branch for "once" sequences
        contentContainerForSequenceBranch = new RuntimeContainer();
      }

      contentContainerForSequenceBranch.name = `s${elIndex}`;
      contentContainerForSequenceBranch.InsertContent(
        RuntimeControlCommand.PopEvaluatedValue(),
        0
      );

      // When sequence element is complete, divert back to end of sequence
      const seqBranchCompleteDivert = new RuntimeDivert();
      contentContainerForSequenceBranch.AddContent(seqBranchCompleteDivert);
      container.AddToNamedContentOnly(contentContainerForSequenceBranch);

      // Save the diverts for reference resolution later (in ResolveReferences)
      this.AddDivertToResolve(
        sequenceDivert,
        contentContainerForSequenceBranch
      );
      this.AddDivertToResolve(seqBranchCompleteDivert, postSequenceNoOp);
    }

    container.AddContent(postSequenceNoOp);

    return container;
  };

  public readonly AddDivertToResolve = (
    divert: RuntimeDivert,
    targetContent: RuntimeObject
  ) => {
    this._sequenceDivertsToResolve.push(
      new SequenceDivertToResolve(divert, targetContent)
    );
  };

  public ResolveReferences(context: Story): void {
    super.ResolveReferences(context);

    for (const toResolve of this._sequenceDivertsToResolve) {
      toResolve.divert.targetPath = toResolve.targetContent.path;
    }
  }
}
