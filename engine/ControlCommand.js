export class ControlCommand{
	constructor(commandType){
		this._commandType = commandType || CommandType.NotSet;
	}
	getCommandType(){
		return this._commandType;
	}
	copy(){
		return new ControlCommand(this._commandType);
	}
	toString(){
		return this._commandType.toString();
	}
	// The following static factory methods are to make generating these objects
	// slightly more succinct. Without these, the code gets pretty massive! e.g.
	//
	//     var c = new Runtime.ControlCommand(Runtime.ControlCommand.CommandType.EvalStart)
	// 
	// as opposed to
	//
	//     var c = Runtime.ControlCommand.EvalStart()
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
	VisitIndex: 12,
	SequenceShuffleIndex: 13,
	Done: 14,
	End: 15,
}
CommandType.TOTAL_VALUES = Object.keys(CommandType).length - 1;//-1 because NotSet shoudn't count
ControlCommand.CommandType = CommandType;