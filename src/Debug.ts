export namespace Debug {
	export function AssertType<T>(variable: any, type: { new (): T }, message: string) {
		Assert(variable instanceof type, message);
	}

	export function Assert(condition: boolean, message?: string) {
		if (!condition) {
			// tslint:disable:no-console
			if (typeof message !== 'undefined') {
				console.warn(message);
			}

			if (console.trace) {
				console.trace();
			}
		}
	}
}
