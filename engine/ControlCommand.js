import {Object as InkObject} from './Object';

export class ControlCommand extends InkObject{
	constructor(commandType){
		super();
		this._commandType = (typeof commandType != 'undefined') ? commandType : CommandType.NotSet;
	}
	get commandType(){
		return this._commandType;
	}
	copy(){
		return new ControlCommand(this.commandType);
	}
	toString(){
		return this.commandType.toString();
	}
	static EvalStart(){
		return new ControlCommand(CommandType.EvalStart);
	}
	static EvalOutput(){
		return new ControlCommand(CommandType.EvalOutput);
	}
	static EvalEnd(){
		return new ControlCommand(CommandType.EvalEnd);
	}
	static Duplicate(){
		return new ControlCommand(CommandType.Duplicate);
	}
	static PopEvaluatedValue(){
		return new ControlCommand(CommandType.PopEvaluatedValue);
	}
	static PopFunction(){
		return new ControlCommand(CommandType.PopFunction);
	}
	static PopTunnel(){
		return new ControlCommand(CommandType.PopTunnel);
	}
	static BeginString(){
		return new ControlCommand(CommandType.BeginString);
	}
	static EndString(){
		return new ControlCommand(CommandType.EndString);
	}
	static NoOp(){
		return new ControlCommand(CommandType.NoOp);
	}
	static ChoiceCount(){
		return new ControlCommand(CommandType.ChoiceCount);
	}
	static TurnsSince(){
		return new ControlCommand(CommandType.TurnsSince);
	}
	static ReadCount(){
		return new ControlCommand(CommandType.ReadCount);
	}
	static Random(){
		return new ControlCommand(CommandType.Random);
	}
	static SeedRandom(){
		return new ControlCommand(CommandType.SeedRandom);
	}
	static VisitIndex(){
		return new ControlCommand(CommandType.VisitIndex);
	}
	static SequenceShuffleIndex(){
		return new ControlCommand(CommandType.SequenceShuffleIndex);
	}
	static StartThread(){
		return new ControlCommand(CommandType.StartThread);
	}
	static Done(){
		return new ControlCommand(CommandType.Done);
	}
	static End(){
		return new ControlCommand(CommandType.End);
	}
	static ListFromInt(){
		return new ControlCommand(CommandType.ListFromInt);
	}
	static ListRange(){
		return new ControlCommand(CommandType.ListRange);
	}
}

var CommandType = {
	NotSet: -1,
	EvalStart: 0,
	EvalOutput: 1,
	EvalEnd: 2,
	Duplicate: 3,
	PopEvaluatedValue: 4,
	PopFunction: 5,
	PopTunnel: 6,
	BeginString: 7,
	EndString: 8,
	NoOp: 9,
	ChoiceCount: 10,
	TurnsSince: 11,
	Random: 12,
	SeedRandom: 13,
	VisitIndex: 14,
	SequenceShuffleIndex: 15,
	StartThread: 16,
	Done: 17,
	End: 18,
	ListFromInt: 19,
	ListRange: 20,
	ReadCount: 21
}
CommandType.TOTAL_VALUES = Object.keys(CommandType).length - 1;//-1 because NotSet shoudn't count
ControlCommand.CommandType = CommandType;