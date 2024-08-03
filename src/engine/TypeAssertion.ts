import { INamedContent } from "./INamedContent";

export function asOrNull<T>(
  obj: any,
  type: (new (...arg: any[]) => T) | (Function & { prototype: T })
): T | null {
  if (obj instanceof type) {
    return unsafeTypeAssertion(obj, type);
  } else {
    return null;
  }
}

export function asOrThrows<T>(
  obj: any,
  type: (new (...arg: any[]) => T) | (Function & { prototype: T })
): T | never {
  if (obj instanceof type) {
    return unsafeTypeAssertion(obj, type);
  } else {
    throw new Error(`${obj} is not of type ${type}`);
  }
}

export function asNumberOrThrows(obj: any) {
  if (typeof obj === "number") {
    return obj as number;
  } else {
    throw new Error(`${obj} is not a number`);
  }
}

export function asBooleanOrThrows(obj: any) {
  if (typeof obj === "boolean") {
    return obj as boolean;
  } else {
    throw new Error(`${obj} is not a boolean`);
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

export function nullIfUndefined<T>(obj: T | undefined): T | null {
  if (typeof obj === "undefined") {
    return null;
  }

  return obj;
}

export function isEquatable(type: any) {
  return typeof type === "object" && typeof type.Equals === "function";
}

function unsafeTypeAssertion<T>(
  obj: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type: (new () => T) | (Function & { prototype: T })
) {
  return obj as T;
}

export function filterUndef<T>(element: T | undefined): element is T {
  return element != undefined;
}
