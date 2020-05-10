
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

		private _rootObject: any;
	}

	export class Writer {
		public WriteObject(inner: (w: Writer) => void) {
			this.WriteObjectStart();
			inner(this);
			this.WriteObjectEnd();
		}

		public WriteObjectStart() {
			this.StartNewObject(true);

			let newObject: Record<string, any> = {};
			this._collectionStack.push(newObject);

			if (this.state === SimpleJson.Writer.State.Object) {
				this.Assert(this.currentCollection !== null);
				this.Assert(this.currentPropertyName !== null);

				let propertyName = this._propertieNameStack.pop();
				this.currentCollection![propertyName!] = newObject;
			} else if (this.state === SimpleJson.Writer.State.Array) {
				this.Assert(this.currentCollection !== null);

				this.currentCollection!.push(newObject);
			} else {
				this.Assert(this.state === null);
				this._jsonObject = newObject;
			}

			this._stateStack.push(new SimpleJson.Writer.StateElement(SimpleJson.Writer.State.Object));
		}

		public WriteObjectEnd() {
			this.Assert(this.state === SimpleJson.Writer.State.Object);
			this._stateStack.pop();
		}

		public WriteProperty(name: any, innerOrContent: (w: Writer) => void | string | number| boolean) {
			this.WritePropertyStart(name);
			if (arguments[1] instanceof Function) {
				let inner = arguments[1];
				inner(this);
			} else {
				let content: string | number| boolean = arguments[1];
				this.Write(content);
			}
			this.WritePropertyEnd();
		}

		public WritePropertyStart(name: any) {
			this.Assert(this.state === SimpleJson.Writer.State.Object);
			this._propertieNameStack.push(name);

			this.IncrementChildCount();

			this._stateStack.push(new SimpleJson.Writer.StateElement(SimpleJson.Writer.State.Property));
		}

		public WritePropertyEnd() {
			this.Assert(this.state === SimpleJson.Writer.State.Property);
			this.Assert(this.childCount == 1);
			this._stateStack.pop();
		}

		public WritePropertyNameStart() {
			this.Assert(this.state === SimpleJson.Writer.State.Object);
			this.IncrementChildCount();

			this._propertyName = '';

			this._stateStack.push(new SimpleJson.Writer.StateElement(SimpleJson.Writer.State.Property));
			this._stateStack.push(new SimpleJson.Writer.StateElement(SimpleJson.Writer.State.PropertyName));
		}

		public WritePropertyNameEnd() {
			this.Assert(this.state === SimpleJson.Writer.State.PropertyName);
			this.Assert(this._propertyName !== null);
			this._propertieNameStack.push(this._propertyName!);
			this._propertyName = null;
			this._stateStack.pop();
		}

		public WritePropertyNameInner(str: string) {
			this.Assert(this.state === SimpleJson.Writer.State.PropertyName);
			this.Assert(this._propertyName !== null);
			this._propertyName += str;
		}

		public WriteArrayStart() {
			this.StartNewObject(true);

			let newObject: any[] = [];
			this._collectionStack.push(newObject);

			if (this.state === SimpleJson.Writer.State.Object) {
				this.Assert(this.currentCollection !== null);
				this.Assert(this.currentPropertyName !== null);

				let propertyName = this._propertieNameStack.pop();
				this.currentCollection![propertyName!] = newObject;
			} else if (this.state === SimpleJson.Writer.State.Array) {
				this.Assert(this.currentCollection !== null);

				this.currentCollection!.push(newObject);
			}

			this._stateStack.push(new SimpleJson.Writer.StateElement(SimpleJson.Writer.State.Array));
		}

		public WriteArrayEnd() {
			this.Assert(this.state === SimpleJson.Writer.State.Array);
			this._collectionStack.pop();
			this._stateStack.pop();
		}

		public Write(value: number | string | boolean, escape: boolean = true) {
			this.StartNewObject(false);

			if (typeof(value) === 'number') {
				if (value == Number.POSITIVE_INFINITY) {
					this._addToCurrentObject('3.4E+38');
				} else if (value == Number.NEGATIVE_INFINITY) {
					this._addToCurrentObject('-3.4E+38');
				} else if (isNaN(value)) {
					this._addToCurrentObject('0.0');
				}
			} else {
				this._addToCurrentObject(value);
			}
		}

		public WriteNull() {
			this.StartNewObject(false);
			this._addToCurrentObject(null);
		}

		public WriteStringStart() {
			this.StartNewObject(false);
			this._stateStack.push(new SimpleJson.Writer.StateElement(SimpleJson.Writer.State.String));
		}

		public WriteStringEnd() {
			this.Assert(this.state == SimpleJson.Writer.State.String);
			this._stateStack.pop();
		}

		public WriteStringInner(str: string, escape: boolean = true) {
			this._addToCurrentObject(str);
		}

		public ToString() {
			if (this._jsonObject === null) {
				return '';
			}

			return JSON.stringify(this._jsonObject);
		}

		private StartNewObject(container: boolean) {
			if (container) {
				this.Assert(this.state === SimpleJson.Writer.State.None ||
							this.state === SimpleJson.Writer.State.Property ||
							this.state === SimpleJson.Writer.State.Array);
			} else {
				this.Assert(this.state === SimpleJson.Writer.State.Property ||
							this.state === SimpleJson.Writer.State.Array);
			}

			if (this.state === SimpleJson.Writer.State.Property) {
				this.Assert(this.childCount === 0);
			}

			if (this.state === SimpleJson.Writer.State.Array || this.state === SimpleJson.Writer.State.Property) {
				this.IncrementChildCount();
			}
		}

		private get state() {
			if (this._stateStack.length > 0) {
				return this._stateStack[0].type;
			} else {
				return SimpleJson.Writer.State.None;
			}
		}

		private get childCount() {
			if (this._stateStack.length > 0) {
				return this._stateStack[0].childCount;
			} else {
				return 0;
			}
		}

		private get currentCollection() {
			if (this._collectionStack.length > 0) {
				return this._collectionStack[0];
			} else {
				return null;
			}
		}

		private get currentPropertyName() {
			if (this._stateStack.length > 0) {
				return this._propertieNameStack[0];
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
			if (!condition)
				throw Error('Assert failed while writing JSON');
		}

		private _propertyName: string | null = null;

		private _stateStack: SimpleJson.Writer.StateElement[] = [];
		private _collectionStack: Array<any[] | Record<string, any>> = [];
		private _propertieNameStack: string[] = [];

		private _jsonObject: Record<string, any> | any[] | null = null;

		private _addToCurrentObject(value: number | string | boolean | null) {
			this.Assert(this.currentCollection !== null);
			if (this.state === SimpleJson.Writer.State.Array) {
				(this.currentCollection as any[]).push(value);
			} else if (this.state === SimpleJson.Writer.State.Property) {
				this.Assert(this.currentPropertyName != null);
				(this.currentCollection as Record<string, any>)[this.currentPropertyName!] = value;
				this._propertieNameStack.pop();
			}
		}
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
