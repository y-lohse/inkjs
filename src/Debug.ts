export namespace Debug {
	// tslint:disable no-string-throw
	export function AssertType<T>(variable: any, type: new () => T, message: string): void | never {
		Assert(variable instanceof type, message);
	}

	export function Assert(condition: boolean, message?: string): void | never {
		if (!condition) {
			// tslint:disable:no-console
			if (typeof message !== 'undefined') {
				console.warn(message);
			}

			if (console.trace) {
				console.trace();
			}

			throw '';
		}
	}
}
