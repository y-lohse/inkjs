import { Argument } from './Argument';
import { FlowBase } from './Flow/FlowBase';
import { FlowLevel } from './Flow/FlowLevel';
import { ParsedObject } from './Object';

export class Stitch extends FlowBase { 
	get flowLevel(): FlowLevel {
		return FlowLevel.Stitch;
	}

	constructor(
		name: string,
		topLevelObjects: ParsedObject[],
		args: Argument[],
		isFunction: boolean)
	{
		super(name, topLevelObjects, args, isFunction);
	}
}

