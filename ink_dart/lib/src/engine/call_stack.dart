import 'ink_object.dart';
import 'pointer.dart';
import 'divert.dart';
import 'container.dart';

/// The call stack manages function and tunnel calls.
///
/// Supports multiple threads for parallel story flows.
class CallStack {
  final List<Thread> _threads = [];
  int _threadCounter = 0;
  Pointer? _startOfRoot;

  CallStack([Container? rootContentContainer]) {
    if (rootContentContainer != null) {
      _startOfRoot = Pointer.startOf(rootContentContainer);
    }
    reset();
  }

  /// Create from another call stack (copy).
  CallStack.from(CallStack other) {
    _threadCounter = other._threadCounter;
    _startOfRoot = other._startOfRoot;

    for (final thread in other._threads) {
      _threads.add(thread.copy());
    }
  }

  /// Reset to initial state.
  void reset() {
    _threads.clear();
    _threads.add(Thread());

    if (_startOfRoot != null) {
      currentThread.callstack.add(Element(
        PushPopType.tunnel,
        _startOfRoot!,
      ));
    }
  }

  /// The current active thread.
  Thread get currentThread => _threads.last;

  set currentThread(Thread value) {
    assert(_threads.length == 1, 'Should only set currentThread when there is one thread');
    _threads.clear();
    _threads.add(value);
  }

  /// All threads.
  List<Thread> get threads => _threads;

  /// The current stack element.
  Element get currentElement {
    final thread = currentThread;
    if (thread.callstack.isEmpty) {
      throw StateError('Call stack is empty');
    }
    return thread.callstack.last;
  }

  /// The current element index in the stack.
  int get currentElementIndex => currentThread.callstack.length - 1;

  /// The current pointer position.
  Pointer get currentPointer => currentElement.currentPointer;

  set currentPointer(Pointer value) {
    currentElement.currentPointer = value;
  }

  /// The depth of the call stack.
  int get depth => currentThread.callstack.length;

  /// All elements in the current thread's stack.
  List<Element> get elements => currentThread.callstack;

  /// Check if we can pop with the given type.
  bool canPop([PushPopType? type]) {
    if (currentThread.callstack.isEmpty) return false;

    if (type == null) return true;

    return currentElement.type == type;
  }

  /// Push a new element onto the stack.
  void push(
    PushPopType type, {
    int externalEvaluationStackHeight = 0,
    int outputStreamLengthWithPushed = 0,
  }) {
    final element = Element(type, currentPointer);
    element.evaluationStackHeightWhenPushed = externalEvaluationStackHeight;
    element.functionStartInOutputStream = outputStreamLengthWithPushed;

    currentThread.callstack.add(element);
  }

  /// Pop an element from the stack.
  void pop([PushPopType? type]) {
    if (type != null && !canPop(type)) {
      throw StateError('Cannot pop type $type');
    }

    currentThread.callstack.removeLast();
  }

  /// Get an element at a specific depth.
  Element? elementAt(int index) {
    if (index < 0 || index >= currentThread.callstack.length) {
      return null;
    }
    return currentThread.callstack[index];
  }

  /// Push a new thread.
  void pushThread() {
    final newThread = currentThread.copy();
    _threadCounter++;
    newThread.threadIndex = _threadCounter;
    _threads.add(newThread);
  }

  /// Fork the current thread.
  Thread forkThread() {
    final forked = currentThread.copy();
    _threadCounter++;
    forked.threadIndex = _threadCounter;
    return forked;
  }

  /// Pop the current thread.
  void popThread() {
    if (_threads.length <= 1) {
      throw StateError('Cannot pop last thread');
    }
    _threads.removeLast();
  }

  /// Whether we can pop a thread.
  bool get canPopThread => _threads.length > 1;

  /// Set a temporary variable.
  void setTemporaryVariable(
    String name,
    InkObject value,
    bool declareNew,
    int contextIndex,
  ) {
    if (contextIndex < 0) {
      contextIndex = currentElementIndex;
    }

    final element = elementAt(contextIndex);
    if (element == null) {
      throw StateError('Invalid context index: $contextIndex');
    }

    // If we're NOT declaring new and the variable doesn't exist, that's an error
    if (!declareNew && !element.temporaryVariables.containsKey(name)) {
      throw StateError('Could not find temporary variable to set: $name');
    }

    // Handle list origin retention for list values
    final oldValue = element.temporaryVariables[name];
    // TODO: ListValue.RetainListOriginsForAssignment when implemented

    element.temporaryVariables[name] = value;
  }

  /// Get a temporary variable.
  InkObject? getTemporaryVariableWithName(String name, [int contextIndex = -1]) {
    if (contextIndex < 0) {
      contextIndex = currentElementIndex;
    }

    final element = elementAt(contextIndex);
    if (element == null) return null;

    final value = element.temporaryVariables[name];
    if (value != null) return value;

    // Check parent contexts
    for (int i = contextIndex - 1; i >= 0; i--) {
      final parentElement = elementAt(i);
      if (parentElement != null) {
        final parentValue = parentElement.temporaryVariables[name];
        if (parentValue != null) return parentValue;
      }
    }

    return null;
  }

  /// Find the context index for a variable.
  int contextForVariableNamed(String name) {
    for (int i = currentElementIndex; i >= 0; i--) {
      final element = elementAt(i);
      if (element != null && element.temporaryVariables.containsKey(name)) {
        return i;
      }
    }
    return -1;
  }

  /// Convert to JSON for serialization.
  Map<String, dynamic> toJson() {
    return {
      'threads': _threads.map((t) => t.toJson()).toList(),
      'threadCounter': _threadCounter,
    };
  }

  /// Load from JSON.
  void loadJson(Map<String, dynamic> json, Container? rootContainer) {
    _threads.clear();

    final threadList = json['threads'] as List<dynamic>;
    for (final threadJson in threadList) {
      final thread = Thread.fromJson(threadJson as Map<String, dynamic>, rootContainer);
      _threads.add(thread);
    }

    _threadCounter = json['threadCounter'] as int;
    _startOfRoot = rootContainer != null ? Pointer.startOf(rootContainer) : null;
  }
}

/// A single thread of execution.
class Thread {
  int threadIndex = 0;
  final List<Element> callstack = [];
  Pointer? previousPointer;

  Thread();

  /// Create from JSON.
  Thread.fromJson(Map<String, dynamic> json, Container? rootContainer) {
    threadIndex = json['threadIndex'] as int;

    final callstackList = json['callstack'] as List<dynamic>;
    for (final elemJson in callstackList) {
      final element = Element.fromJson(elemJson as Map<String, dynamic>, rootContainer);
      callstack.add(element);
    }

    // TODO: Load previousPointer
  }

  /// Create a copy of this thread.
  Thread copy() {
    final copied = Thread();
    copied.threadIndex = threadIndex;
    copied.previousPointer = previousPointer?.copy();

    for (final elem in callstack) {
      copied.callstack.add(elem.copy());
    }

    return copied;
  }

  /// Convert to JSON.
  Map<String, dynamic> toJson() {
    return {
      'threadIndex': threadIndex,
      'callstack': callstack.map((e) => e.toJson()).toList(),
    };
  }
}

/// A single element on the call stack.
class Element {
  Pointer currentPointer;
  bool inExpressionEvaluation = false;
  final Map<String, InkObject> temporaryVariables = {};
  PushPopType type;
  int? evaluationStackHeightWhenPushed;
  int? functionStartInOutputStream;

  Element(this.type, this.currentPointer);

  /// Create from JSON.
  Element.fromJson(Map<String, dynamic> json, Container? rootContainer)
      : currentPointer = Pointer.null_(),
        type = PushPopType.values[json['type'] as int] {
    // TODO: Resolve pointer from path
    inExpressionEvaluation = json['exp'] as bool? ?? false;
  }

  /// Create a copy of this element.
  Element copy() {
    final copied = Element(type, currentPointer.copy());
    copied.inExpressionEvaluation = inExpressionEvaluation;
    copied.temporaryVariables.addAll(temporaryVariables);
    copied.evaluationStackHeightWhenPushed = evaluationStackHeightWhenPushed;
    copied.functionStartInOutputStream = functionStartInOutputStream;
    return copied;
  }

  /// Convert to JSON.
  Map<String, dynamic> toJson() {
    return {
      'type': type.index,
      'exp': inExpressionEvaluation,
      'temp': {}, // TODO: Serialize temp variables
    };
  }
}
