import { Container as RuntimeContainer } from "../../../engine/Container";
import { Identifier } from "./Identifier";
import { ParsedObject } from "./Object";

export interface IWeavePoint extends ParsedObject {
  readonly content: ParsedObject[];
  readonly indentationDepth: number;
  readonly name: string | null;
  readonly identifier?: Identifier;
  readonly runtimeContainer: RuntimeContainer | null;
}
