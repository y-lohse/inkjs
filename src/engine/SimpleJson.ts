export class SimpleJson {
  public static TextToDictionary(text: string) {
    return new SimpleJson.Reader(text).ToDictionary();
  }

  public static TextToArray(text: string) {
    return new SimpleJson.Reader(text).ToArray();
  }
}

export namespace SimpleJson {
  export class Reader {
    constructor(text: string) {
      this._rootObject = JSON.parse(text);
    }

    public ToDictionary() {
      return this._rootObject as Record<string, any>;
    }

    public ToArray() {
      return this._rootObject as any[];
    }

    private _rootObject: any[] | Record<string, any>;
  }

  // In C#, this class writes json tokens directly to a StringWriter or
  // another stream. Here, a temporary hierarchy is created in the form
  // of a javascript object, which is serialised in the `toString` method.
  // See individual methods and properties for more information.
  export class Writer {
    public WriteObject(inner: (w: Writer) => void) {
      this.WriteObjectStart();
      inner(this);
      this.WriteObjectEnd();
    }

    // Add a new object.
    public WriteObjectStart() {
      this.StartNewObject(true);

      let newObject: Record<string, any> = {};

      if (this.state === SimpleJson.Writer.State.Property) {
        // This object is created as the value of a property,
        // inside an other object.
        this.Assert(this.currentCollection !== null);
        this.Assert(this.currentPropertyName !== null);

        let propertyName = this._propertyNameStack.pop();
        this.currentCollection![propertyName!] = newObject;
        this._collectionStack.push(newObject);
      } else if (this.state === SimpleJson.Writer.State.Array) {
        // This object is created as the child of an array.
        this.Assert(this.currentCollection !== null);

        this.currentCollection!.push(newObject);
        this._collectionStack.push(newObject);
      } else {
        // This object is the root object.
        this.Assert(this.state === SimpleJson.Writer.State.None);
        this._jsonObject = newObject;
        this._collectionStack.push(newObject);
      }

      this._stateStack.push(
        new SimpleJson.Writer.StateElement(SimpleJson.Writer.State.Object)
      );
    }

    public WriteObjectEnd() {
      this.Assert(this.state === SimpleJson.Writer.State.Object);
      this._collectionStack.pop();
      this._stateStack.pop();
    }

    // Write a property name / value pair to the current object.
    public WriteProperty(
      name: any,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      innerOrContent: ((w: Writer) => void) | string | boolean | null
    ) {
      this.WritePropertyStart(name);
      if (arguments[1] instanceof Function) {
        let inner = arguments[1];
        inner(this);
      } else {
        let content: string | boolean | null = arguments[1];
        this.Write(content);
      }
      this.WritePropertyEnd();
    }

    // Int and Float are separate calls, since there both are
    // numbers in JavaScript, but need to be handled differently.

    public WriteIntProperty(name: any, content: number) {
      this.WritePropertyStart(name);
      this.WriteInt(content);
      this.WritePropertyEnd();
    }

    public WriteFloatProperty(name: any, content: number) {
      this.WritePropertyStart(name);
      this.WriteFloat(content);
      this.WritePropertyEnd();
    }

    // Prepare a new property name, which will be use to add the
    // new object when calling _addToCurrentObject() from a Write
    // method.
    public WritePropertyStart(name: any) {
      this.Assert(this.state === SimpleJson.Writer.State.Object);
      this._propertyNameStack.push(name);

      this.IncrementChildCount();

      this._stateStack.push(
        new SimpleJson.Writer.StateElement(SimpleJson.Writer.State.Property)
      );
    }

    public WritePropertyEnd() {
      this.Assert(this.state === SimpleJson.Writer.State.Property);
      this.Assert(this.childCount === 1);
      this._stateStack.pop();
    }

    // Prepare a new property name, except this time, the property name
    // will be created by concatenating all the strings passed to
    // WritePropertyNameInner.
    public WritePropertyNameStart() {
      this.Assert(this.state === SimpleJson.Writer.State.Object);
      this.IncrementChildCount();

      this._currentPropertyName = "";

      this._stateStack.push(
        new SimpleJson.Writer.StateElement(SimpleJson.Writer.State.Property)
      );
      this._stateStack.push(
        new SimpleJson.Writer.StateElement(SimpleJson.Writer.State.PropertyName)
      );
    }

    public WritePropertyNameEnd() {
      this.Assert(this.state === SimpleJson.Writer.State.PropertyName);
      this.Assert(this._currentPropertyName !== null);
      this._propertyNameStack.push(this._currentPropertyName!);
      this._currentPropertyName = null;
      this._stateStack.pop();
    }

    public WritePropertyNameInner(str: string) {
      this.Assert(this.state === SimpleJson.Writer.State.PropertyName);
      this.Assert(this._currentPropertyName !== null);
      this._currentPropertyName += str;
    }

    // Add a new array.
    public WriteArrayStart() {
      this.StartNewObject(true);

      let newObject: any[] = [];

      if (this.state === SimpleJson.Writer.State.Property) {
        // This array is created as the value of a property,
        // inside an object.
        this.Assert(this.currentCollection !== null);
        this.Assert(this.currentPropertyName !== null);

        let propertyName = this._propertyNameStack.pop();
        this.currentCollection![propertyName!] = newObject;
        this._collectionStack.push(newObject);
      } else if (this.state === SimpleJson.Writer.State.Array) {
        // This array is created as the child of another array.
        this.Assert(this.currentCollection !== null);

        this.currentCollection!.push(newObject);
        this._collectionStack.push(newObject);
      } else {
        // This array is the root object.
        this.Assert(this.state === SimpleJson.Writer.State.None);
        this._jsonObject = newObject;
        this._collectionStack.push(newObject);
      }

      this._stateStack.push(
        new SimpleJson.Writer.StateElement(SimpleJson.Writer.State.Array)
      );
    }

    public WriteArrayEnd() {
      this.Assert(this.state === SimpleJson.Writer.State.Array);
      this._collectionStack.pop();
      this._stateStack.pop();
    }

    // Add the value to the appropriate collection (array / object), given the current
    // context.
    public Write(
      value: number | string | boolean | null,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      escape: boolean = true
    ) {
      if (value === null) {
        console.error("Warning: trying to write a null value");
        return;
      }

      this.StartNewObject(false);
      this._addToCurrentObject(value);
    }

    public WriteBool(value: boolean | null) {
      if (value === null) {
        return;
      }

      this.StartNewObject(false);
      this._addToCurrentObject(value);
    }

    public WriteInt(value: number | null) {
      if (value === null) {
        return;
      }

      this.StartNewObject(false);

      // Math.floor is used as a precaution:
      //     1. to ensure that the value is written as an integer
      //        (without a fractional part -> 1 instead of 1.0), even
      //        though it should be the default behaviour of
      //        JSON.serialize;
      //     2. to ensure that if a floating number is passed
      //        accidentally, it's converted to an integer.
      //
      // This guarantees savegame compatibility with the reference
      // implementation.
      this._addToCurrentObject(Math.floor(value));
    }

    // Since JSON doesn't support NaN and Infinity, these values
    // are converted here.
    public WriteFloat(value: number | null) {
      if (value === null) {
        return;
      }

      this.StartNewObject(false);
      if (value == Number.POSITIVE_INFINITY) {
        this._addToCurrentObject(3.4e38);
      } else if (value == Number.NEGATIVE_INFINITY) {
        this._addToCurrentObject(-3.4e38);
      } else if (isNaN(value)) {
        this._addToCurrentObject(0.0);
      } else {
        this._addToCurrentObject(value);
      }
    }

    public WriteNull() {
      this.StartNewObject(false);
      this._addToCurrentObject(null);
    }

    // Prepare a string before adding it to the current collection in
    // WriteStringEnd(). The string will be a concatenation of all the
    // strings passed to WriteStringInner.
    public WriteStringStart() {
      this.StartNewObject(false);
      this._currentString = "";
      this._stateStack.push(
        new SimpleJson.Writer.StateElement(SimpleJson.Writer.State.String)
      );
    }

    public WriteStringEnd() {
      this.Assert(this.state == SimpleJson.Writer.State.String);
      this._stateStack.pop();
      this._addToCurrentObject(this._currentString);
      this._currentString = null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public WriteStringInner(str: string | null, escape: boolean = true) {
      this.Assert(this.state === SimpleJson.Writer.State.String);

      if (str === null) {
        console.error("Warning: trying to write a null string");
        return;
      }

      this._currentString += str;
    }

    // Serialise the root object into a JSON string.
    public toString() {
      if (this._jsonObject === null) {
        return "";
      }

      return JSON.stringify(this._jsonObject);
    }

    // Prepare the state stack when adding new objects / values.
    private StartNewObject(container: boolean) {
      if (container) {
        this.Assert(
          this.state === SimpleJson.Writer.State.None ||
            this.state === SimpleJson.Writer.State.Property ||
            this.state === SimpleJson.Writer.State.Array
        );
      } else {
        this.Assert(
          this.state === SimpleJson.Writer.State.Property ||
            this.state === SimpleJson.Writer.State.Array
        );
      }

      if (this.state === SimpleJson.Writer.State.Property) {
        this.Assert(this.childCount === 0);
      }

      if (
        this.state === SimpleJson.Writer.State.Array ||
        this.state === SimpleJson.Writer.State.Property
      ) {
        this.IncrementChildCount();
      }
    }

    // These getters peek all the different stacks.

    private get state() {
      if (this._stateStack.length > 0) {
        return this._stateStack[this._stateStack.length - 1].type;
      } else {
        return SimpleJson.Writer.State.None;
      }
    }

    private get childCount() {
      if (this._stateStack.length > 0) {
        return this._stateStack[this._stateStack.length - 1].childCount;
      } else {
        return 0;
      }
    }

    private get currentCollection(): Record<string, any> | null {
      if (this._collectionStack.length > 0) {
        return this._collectionStack[this._collectionStack.length - 1];
      } else {
        return null;
      }
    }

    private get currentPropertyName() {
      if (this._propertyNameStack.length > 0) {
        return this._propertyNameStack[this._propertyNameStack.length - 1];
      } else {
        return null;
      }
    }

    private IncrementChildCount() {
      this.Assert(this._stateStack.length > 0);
      let currEl = this._stateStack.pop()!;
      currEl.childCount++;
      this._stateStack.push(currEl);
    }

    private Assert(condition: boolean) {
      if (!condition) throw Error("Assert failed while writing JSON");
    }

    // This method did not exist in the original C# code. It adds
    // the given value to the current collection (used by Write methods).
    private _addToCurrentObject(value: number | string | boolean | null) {
      this.Assert(this.currentCollection !== null);
      if (this.state === SimpleJson.Writer.State.Array) {
        this.Assert(Array.isArray(this.currentCollection));
        (this.currentCollection as any[]).push(value);
      } else if (this.state === SimpleJson.Writer.State.Property) {
        this.Assert(!Array.isArray(this.currentCollection));
        this.Assert(this.currentPropertyName !== null);
        (this.currentCollection as Record<string, any>)[
          this.currentPropertyName!
        ] = value;
        this._propertyNameStack.pop();
      }
    }

    // In addition to `_stateStack` present in the original code,
    // this implementation of SimpleJson use two other stacks and two
    // temporary variables holding the current context.

    // Used to keep track of the current property name being built
    // with `WritePropertyNameStart`, `WritePropertyNameInner` and
    // `WritePropertyNameEnd`.
    private _currentPropertyName: string | null = null;

    // Used to keep track of the current string value being built
    // with `WriteStringStart`, `WriteStringInner` and
    // `WriteStringEnd`.
    private _currentString: string | null = null;

    private _stateStack: SimpleJson.Writer.StateElement[] = [];

    // Keep track of the current collection being built (either an array
    // or an object). For instance, at the '?' step during the hiarchy
    // creation, this hierarchy:
    // [3, {a: [b, ?]}] will have this corresponding stack:
    // (bottom) [Array, Object, Array] (top)
    private _collectionStack: Array<any[] | Record<string, any>> = [];

    // Keep track of the current property being assigned. For instance, at
    // the '?' step during the hiarchy creation, this hierarchy:
    // [3, {a: [b, {c: ?}]}] will have this corresponding stack:
    // (bottom) [a, c] (top)
    private _propertyNameStack: string[] = [];

    // Object containing the entire hiearchy.
    private _jsonObject: Record<string, any> | any[] | null = null;
  }

  export namespace Writer {
    export enum State {
      None,
      Object,
      Array,
      Property,
      PropertyName,
      String,
    }

    export class StateElement {
      public type: SimpleJson.Writer.State = SimpleJson.Writer.State.None;
      public childCount: number = 0;

      constructor(type: SimpleJson.Writer.State) {
        this.type = type;
      }
    }
  }
}
