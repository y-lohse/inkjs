import { ParsedObject } from "./Object";

export type FindQueryFunc<T extends ParsedObject> = (obj: T) => boolean;
