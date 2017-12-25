import {StringBuilder} from './StringBuilder';

class StepDetails {
  constructor({ type = '', detail = '', time = 0 }){
    this.type = type;
    this.detail = detail;
    this.time = time;
  }
}

class ProfileNode {
  constructor(key = ''){
    this._nodes = null;
    this._selfMillisecs = null;
    this._totalMillisecs = null;
    this._selfSampleCount = null;
    this._totalSampleCount = null;
    
    this.key = key;
  }
  
  get hasChildren(){
    return _nodes != null && Object.keys(this._nodes).length > 0;
  }
  
  InternalAddSample(stack, duration){
    this.AddSample(stack, -1, duration);
  }
  
  AddSample(stack, stackIdx, duration){
    this._totalSampleCount++;
		this._totalMillisecs += duration;
    
    if(stackIdx == stack.length - 1) {
		  this._selfSampleCount++;
		  this._selfMillisecs += duration;
		}
    
    if(stackIdx + 1 < stack.length)
      this.AddSampleToNode(stack, stackIdx + 1, duration);
  }
  
  AddSampleToNode(stack, stackIdx, duration){
    var nodeKey = stack[stackIdx];
    if (this._nodes == null) this._nodes = {};
    
    var node;
    if(node = this._nodes[nodeKey] === undefined){
		  node = new ProfileNode(nodeKey);
		  this._nodes[nodeKey] = node;
		}
  }
  


		void AddSampleToNode(string[] stack, int stackIdx, double duration)
		{
			var nodeKey = stack[stackIdx];
			if( _nodes == null ) _nodes = new Dictionary<string, ProfileNode>();

			ProfileNode node;
			if( !_nodes.TryGetValue(nodeKey, out node) ) {
				node = new ProfileNode(nodeKey);
				_nodes[nodeKey] = node;
			}

			node.AddSample(stack, stackIdx, duration);
		}

        /// <summary>
        /// Returns a sorted enumerable of the nodes in descending order of
        /// how long they took to run.
        /// </summary>
		public IEnumerable<KeyValuePair<string, ProfileNode>> descendingOrderedNodes {
			get {
				if( _nodes == null ) return null;
				return _nodes.OrderByDescending(keyNode => keyNode.Value._totalMillisecs);
			}
		}

		void PrintHierarchy(StringBuilder sb, int indent)
		{
			Pad(sb, indent);

			sb.Append(key);
			sb.Append(": ");
			sb.AppendLine(ownReport);

			if( _nodes == null ) return;

			foreach(var keyNode in descendingOrderedNodes) {
				keyNode.Value.PrintHierarchy(sb, indent+1);
			}
		}

        /// <summary>
        /// Generates a string giving timing information for this single node, including
        /// total milliseconds spent on the piece of ink, the time spent within itself
        /// (v.s. spent in children), as well as the number of samples (instruction steps)
        /// recorded for both too.
        /// </summary>
        /// <value>The own report.</value>
		public string ownReport {
			get {
				var sb = new StringBuilder();
				sb.Append("total ");
				sb.Append(Profiler.FormatMillisecs(_totalMillisecs));
				sb.Append(", self ");
				sb.Append(Profiler.FormatMillisecs(_selfMillisecs));
				sb.Append(" (");
				sb.Append(_selfSampleCount);
				sb.Append(" self samples, ");
				sb.Append(_totalSampleCount);
				sb.Append(" total)");
				return sb.ToString();
			}
			
		}

		void Pad(StringBuilder sb, int spaces)
		{
			for(int i=0; i<spaces; i++) sb.Append("   ");
		}

        /// <summary>
        /// String is a report of the sub-tree from this node, but without any of the header information
        /// that's prepended by the Profiler in its Report() method.
        /// </summary>
		public override string ToString ()
		{
			var sb = new StringBuilder();
			PrintHierarchy(sb, 0);
			return sb.ToString();
		}

		
}

export class Profiler {
  constructor() {
    this._rootNode = new ProfileNode();
  }
  get rootNode(){
    return this._rootNode;
  }
  Report(){
    var sb = new StringBuilder();
    sb.AppendFormat("{0} CONTINUES / LINES:\n", this._numContinues);
    sb.AppendFormat("TOTAL TIME: {0}\n", FormatMillisecs(this._continueTotal));
    sb.AppendFormat("SNAPSHOTTING: {0}\n", FormatMillisecs(this._snapTotal));
    sb.AppendFormat("RESTORING: {0}\n", FormatMillisecs(this._restoreTotal));
    sb.AppendFormat("OTHER: {0}\n", FormatMillisecs(this._continueTotal - (this._stepTotal + this._snapTotal + this._restoreTotal)));
    sb.Append(this._rootNode.toString());
    return sb.toString();
  }
  PreContinue(){
    this._continueWatch.Reset();
    this._continueWatch.Start();
  }
  PostContinue(){
    this._continueWatch.Stop();
		this._continueTotal += Millisecs(this._continueWatch);
		this._numContinues++;
  }
  PreStep(){
    this._currStepStack = null;
		this._stepWatch.Reset();
		this._stepWatch.Start();
  }
  Step(callstack){
    this._stepWatch.Stop();

    var stack = [];
    for(var i = 0; i < callstack.elements.length; i++) {
      var objPath = callstack.elements[i].currentObject.path;
      var stackElementName = "";

      for(var c = 0; c < objPath.length; c++) {
        var comp = objPath.GetComponent(c);
        if(!comp.isIndex) {
          stackElementName = comp.name;
          break;
        }
      }

      stack[i] = stackElementName;
    }

    this._currStepStack = stack;

    var currObj = callstack.currentElement.currentObject || callstack.currentElement.currentContainer;

    this._currStepDetails = new StepDetails({
      type: currObj.GetType().Name,
      detail: currObj.ToString()
    });

    this._stepWatch.Start();
  }
  PostStep(){
    this._stepWatch.Stop();

    var duration = Millisecs(this._stepWatch);
    this._stepTotal += duration;

    this._rootNode.AddSample(this._currStepStack, duration);

    this._currStepDetails.time = duration;
    this._stepDetails.Add(this._currStepDetails);
  }
  StepLengthReport(){
    var sb = new StringBuilder();

    var averageStepTimes = this._stepDetails
      .GroupBy(s => s.type)
      .Select(typeToDetails => new KeyValuePair<string, double>(typeToDetails.Key, typeToDetails.Average(d => d.time)))
      .OrderByDescending(stepTypeToAverage => stepTypeToAverage.Value)
      .Select(stepTypeToAverage => {
        var typeName = stepTypeToAverage.Key;
        var time = stepTypeToAverage.Value;
        return typeName + ": " + time + "ms";
      })
      .ToArray();

    sb.AppendLine("AVERAGE STEP TIMES: "+string.Join(", ", averageStepTimes));

    var maxStepTimes = _stepDetails
      .OrderByDescending(d => d.time)
      .Select(d => d.detail + ":" + d.time + "ms")
      .Take(100)
      .ToArray();

    sb.AppendLine("MAX STEP TIMES: "+string.Join("\n", maxStepTimes));

    return sb.ToString();
  }
}



        /// <summary>
        /// Generate a printable report specifying the average and maximum times spent
        /// stepping over different internal ink instruction types.
        /// This report type is primarily used to profile the ink engine itself rather
        /// than your own specific ink.
        /// </summary>
		public string StepLengthReport()
		{
			
		}

		internal void PreSnapshot() {
			_snapWatch.Reset();
			_snapWatch.Start();
		}

		internal void PostSnapshot() {
			_snapWatch.Stop();
			_snapTotal += Millisecs(_snapWatch);
		}

		internal void PreRestore() {
			_restoreWatch.Reset();
			_restoreWatch.Start();
		}

		internal void PostRestore() {
			_restoreWatch.Stop();
			_restoreTotal += Millisecs(_restoreWatch);
		}

		double Millisecs(Stopwatch watch)
		{
			var ticks = watch.ElapsedTicks;
			return ticks * _millisecsPerTick;
		}

		internal static string FormatMillisecs(double num) {
			if( num > 5000 ) {
				return string.Format("{0:N1} secs", num / 1000.0);
			} if( num > 1000 ) {
				return string.Format("{0:N2} secs", num / 1000.0);
			} else if( num > 100 ) {
				return string.Format("{0:N0} ms", num);
			} else if( num > 1 ) {
				return string.Format("{0:N1} ms", num);
			} else if( num > 0.01 ) {
				return string.Format("{0:N3} ms", num);
			} else {
				return string.Format("{0:N} ms", num);
			}
		}

		Stopwatch _continueWatch = new Stopwatch();
		Stopwatch _stepWatch = new Stopwatch();
		Stopwatch _snapWatch = new Stopwatch();
		Stopwatch _restoreWatch = new Stopwatch();

		double _continueTotal;
		double _snapTotal;
		double _stepTotal;
		double _restoreTotal;

		string[] _currStepStack;
		StepDetails _currStepDetails;
		ProfileNode _rootNode;
		int _numContinues;

		struct StepDetails {
			public string type;
			public string detail;
			public double time;
		}
		List<StepDetails> _stepDetails = new List<StepDetails>();

		static double _millisecsPerTick = 1000.0 / Stopwatch.Frequency;
	}

  
  
  
  
}