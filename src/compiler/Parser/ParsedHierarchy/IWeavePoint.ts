import { Container as RuntimeContainer } from '../../../engine/Container';
import { ParsedObject } from './Object';

export interface IWeavePoint extends ParsedObject {
  readonly content: ParsedObject[];
  readonly indentationDepth: number;
  readonly name: string;
  readonly runtimeContainer: RuntimeContainer | null;
}
