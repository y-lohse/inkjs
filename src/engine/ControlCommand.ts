import { InkObject } from "./Object";

export class ControlCommand extends InkObject {
  private _commandType: ControlCommand.CommandType;

  get commandType(): ControlCommand.CommandType {
    return this._commandType;
  }

  constructor(
    commandType: ControlCommand.CommandType = ControlCommand.CommandType.NotSet
  ) {
    super();
    this._commandType = commandType;
  }

  public Copy() {
    return new ControlCommand(this.commandType);
  }
  public static EvalStart() {
    return new ControlCommand(ControlCommand.CommandType.EvalStart);
  }
  public static EvalOutput() {
    return new ControlCommand(ControlCommand.CommandType.EvalOutput);
  }
  public static EvalEnd() {
    return new ControlCommand(ControlCommand.CommandType.EvalEnd);
  }
  public static Duplicate() {
    return new ControlCommand(ControlCommand.CommandType.Duplicate);
  }
  public static PopEvaluatedValue() {
    return new ControlCommand(ControlCommand.CommandType.PopEvaluatedValue);
  }
  public static PopFunction() {
    return new ControlCommand(ControlCommand.CommandType.PopFunction);
  }
  public static PopTunnel() {
    return new ControlCommand(ControlCommand.CommandType.PopTunnel);
  }
  public static BeginString() {
    return new ControlCommand(ControlCommand.CommandType.BeginString);
  }
  public static EndString() {
    return new ControlCommand(ControlCommand.CommandType.EndString);
  }
  public static NoOp() {
    return new ControlCommand(ControlCommand.CommandType.NoOp);
  }
  public static ChoiceCount() {
    return new ControlCommand(ControlCommand.CommandType.ChoiceCount);
  }
  public static Turns() {
    return new ControlCommand(ControlCommand.CommandType.Turns);
  }
  public static TurnsSince() {
    return new ControlCommand(ControlCommand.CommandType.TurnsSince);
  }
  public static ReadCount() {
    return new ControlCommand(ControlCommand.CommandType.ReadCount);
  }
  public static Random() {
    return new ControlCommand(ControlCommand.CommandType.Random);
  }
  public static SeedRandom() {
    return new ControlCommand(ControlCommand.CommandType.SeedRandom);
  }
  public static VisitIndex() {
    return new ControlCommand(ControlCommand.CommandType.VisitIndex);
  }
  public static SequenceShuffleIndex() {
    return new ControlCommand(ControlCommand.CommandType.SequenceShuffleIndex);
  }
  public static StartThread() {
    return new ControlCommand(ControlCommand.CommandType.StartThread);
  }
  public static Done() {
    return new ControlCommand(ControlCommand.CommandType.Done);
  }
  public static End() {
    return new ControlCommand(ControlCommand.CommandType.End);
  }
  public static ListFromInt() {
    return new ControlCommand(ControlCommand.CommandType.ListFromInt);
  }
  public static ListRange() {
    return new ControlCommand(ControlCommand.CommandType.ListRange);
  }
  public static ListRandom() {
    return new ControlCommand(ControlCommand.CommandType.ListRandom);
  }
  public static BeginTag() {
    return new ControlCommand(ControlCommand.CommandType.BeginTag);
  }
  public static EndTag() {
    return new ControlCommand(ControlCommand.CommandType.EndTag);
  }
  public toString() {
    return "ControlCommand " + this.commandType.toString();
  }
}

export namespace ControlCommand {
  export enum CommandType {
    NotSet = -1,
    EvalStart, // 0
    EvalOutput, // 1
    EvalEnd, // 2
    Duplicate, // 3
    PopEvaluatedValue, // 4
    PopFunction, // 5
    PopTunnel, // 6
    BeginString, // 7
    EndString, // 8
    NoOp, // 9
    ChoiceCount, // 10
    Turns, // 11
    TurnsSince, // 12
    ReadCount, // 13
    Random, // 14
    SeedRandom, // 15
    VisitIndex, // 16
    SequenceShuffleIndex, // 17
    StartThread, // 18
    Done, // 19
    End, // 20
    ListFromInt, // 21
    ListRange, // 22
    ListRandom, // 23
    BeginTag, // 24
    EndTag, // 25

    TOTAL_VALUES,
  }
}
