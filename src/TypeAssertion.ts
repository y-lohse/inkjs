import {INamedContent} from './INamedContent';

export function asOrNull<T>(obj: any, type: { new (): T }){
	if (obj instanceof type) {
		return unsafeTypeAssertion(obj, type);
	} else {
		return null;
	}
}

export function asOrThrows<T>(obj: any, type: { new (): T }){
	if (obj instanceof type) {
		return unsafeTypeAssertion(obj, type);
	} else {
		throw new Error(`${obj} is not of type ${type}`);
	}
}

// So here, in the reference implementation, contentObj is casted to an INamedContent
// but here we use js-style duck typing: if it implements the same props as the interface,
// we treat it as valid.
export function asINamedContentOrNull(obj: any): INamedContent | null {
	if (obj.hasValidName && obj.name) {
		return obj as INamedContent;
	}

	return null;
}

function unsafeTypeAssertion<T>(obj: any, type: { new (): T }){
	return obj as T;
}
