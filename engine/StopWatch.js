// This is simple replacement of the Stopwatch class from the .NET Framework.
// The original class can count time with much more accuracy than the Javascript version.
// It might be worth considering using `window.performance` in the browser
// or `process.hrtime()` in node.
export class Stopwatch {
	constructor(){
		this.startTime;
	}

	get ElapsedMilliseconds(){
		return (new Date().getTime()) - this.startTime;
	}

	Start(){
		this.startTime = new Date().getTime();
	}
	Stop(){
		this.startTime = undefined;
	}
}
